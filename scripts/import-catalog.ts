import "dotenv/config";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import {
  getSeafileToken,
  findFilesRecursive,
  downloadFile,
  type SeafileConfig,
} from "./lib/seafile";
import {
  searchAssetsByFilename,
  type ImmichConfig,
  type PhotoMatchContext,
} from "./lib/immich";
import {
  extractGemsFromText,
  extractJewelryType,
  extractInchSize,
  decodeMetal,
  decodeGemCode,
  coarseMetal,
  buildNameAndDescription,
  deriveMetalAndStoneFromFilename,
  canonicalizeCategory,
} from "./lib/parse";
import type { JewelryItem, JewelryPhoto } from "../src/lib/types";
const OUTPUT_PATH = path.join(process.cwd(), "src/data/catalog.json");
const COLUMN_ALIASES: Record<string, string[]> = {
  styleNumber: [
    "style",
    "style #",
    "style#",
    "style no",
    "style number",
    "item",
    "item #",
    "item#",
    "item no",
    "sku",
  ],
  name: ["name", "item name", "title", "product name"],
  rawDesc: ["desc", "description", "details", "notes"],
  category: ["category"],
  metal: ["metal", "metal type"],
  gem: ["gem", "gem type", "stone", "stone type", "gemstone"],
  size: ["size"],
  // Diamond-accent weight and the gemstone's own weight are genuinely
  // separate columns on sheets that have both (e.g. "0.02CTW/1.25GTW RB/WH
  // DIAM RING") — captured independently rather than merged into one field.
  // "CTW /GTW" (seen combined into one column on some sheets) is treated as
  // CTW — every sheet observed using that combined header is a pure-diamond
  // sheet (Type/Diam = lab-grown diamond, no separate Gem value).
  ctw: ["ctw", "tctw", "total ctw", "total carat", "ct tw", "carat weight", "ctw /gtw", "ctw/gtw"],
  gtw: ["gtw", "tgtw", "total gtw"],
  quantityAvailable: [
    "qty",
    "quantity",
    "qty available",
    "available qty",
    "stock",
    "on hand",
  ],
  price: ["price", "cost", "unit price", "wholesale price", "wholesale"],
  collection: ["collection", "group", "lot"],
  closeoutYear: ["year", "closeout year"],
  // Internal-only — read to detect sold rows (see soldRowSkippedCount below),
  // never mapped onto the customer-facing JewelryItem.
  company: ["company"],
  memoInvoice: ["memo/invoice", "memo / invoice", "invoice/memo", "memo", "invoice"],
};
/** "0" or blank means "not applicable" for a weight column, not a real measurement. */
function presentWeight(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return Number(value) > 0 ? value : undefined;
}
function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}
function buildHeaderMap(headers: string[]): Record<string, string> {
  const normalized = headers.map(normalizeHeader);
  const map: Record<string, string> = {};
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    const idx = normalized.findIndex((h) => aliases.includes(h));
    if (idx !== -1) map[field] = headers[idx];
  }
  return map;
}
function sheetsFromWorkbook(
  buffer: Buffer,
): { sheetName: string; rows: Record<string, unknown>[] }[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  return workbook.SheetNames.map((sheetName) => ({
    sheetName,
    rows: XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" }),
  }));
}
async function resolvePhotos(
  immich: ImmichConfig | undefined,
  styleNumber: string,
  photoCache: Map<string, JewelryPhoto[]>,
  matchContext: PhotoMatchContext,
): Promise<{
  photos: JewelryPhoto[];
  fromCache: boolean;
}> {
  const cached = photoCache.get(styleNumber);
  if (cached) return { photos: cached, fromCache: true };
  if (!immich) return { photos: [], fromCache: false };
  const maxPhotos = Number(process.env.MAX_PHOTOS_PER_ITEM ?? 6);
  const size =
    (process.env.IMMICH_THUMBNAIL_SIZE as "thumbnail" | "preview") ?? "preview";
  let assets;
  try {
    assets = await searchAssetsByFilename(immich, styleNumber, matchContext);
  } catch (err) {
    console.warn(
      `  Photo search failed for ${styleNumber}: ${err instanceof Error ? err.message : err}`,
    );
    return { photos: [], fromCache: false };
  }
  const photos = assets.slice(0, maxPhotos).map((asset, i) => ({
    url: `/api/immich-image/${asset.id}/${size}`,
    alt: `${styleNumber} photo ${i + 1}`,
  }));
  if (photos.length > 0) photoCache.set(styleNumber, photos);
  return { photos, fromCache: false };
}
async function main() {
  const serverUrl = process.env.SEAFILE_SERVER_URL;
  const repoId = process.env.SEAFILE_REPO_ID;
  const folderPath = process.env.SEAFILE_FOLDER_PATH;
  if (!serverUrl || !repoId || !folderPath) {
    throw new Error(
      "Missing SEAFILE_SERVER_URL, SEAFILE_REPO_ID, or SEAFILE_FOLDER_PATH in .env",
    );
  }
  let token = process.env.SEAFILE_API_TOKEN;
  if (!token) {
    const username = process.env.SEAFILE_USERNAME;
    const password = process.env.SEAFILE_PASSWORD;
    if (!username || !password) {
      throw new Error(
        "Provide either SEAFILE_API_TOKEN or SEAFILE_USERNAME + SEAFILE_PASSWORD in .env",
      );
    }
    token = await getSeafileToken(serverUrl, username, password);
  }
  const config: SeafileConfig = { serverUrl, repoId, token };
  const immichBaseUrl = process.env.IMMICH_BASE_URL;
  const immichApiKey = process.env.IMMICH_API_KEY;
  const immich: ImmichConfig | undefined =
    immichBaseUrl && immichApiKey
      ? { baseUrl: immichBaseUrl, apiKey: immichApiKey }
      : undefined;
  if (!immich) {
    console.warn(
      "IMMICH_BASE_URL / IMMICH_API_KEY not set — importing without photos.",
    );
  }
  console.log(`Scanning ${folderPath} for Excel files...`);
  const excelFiles = await findFilesRecursive(config, folderPath, [
    ".xlsx",
    ".xls",
  ]);
  console.log(`Found ${excelFiles.length} Excel file(s).`);
  const photoCache = new Map<string, JewelryPhoto[]>();
  if (process.env.FORCE_PHOTO_REFRESH === "true") {
    console.log(
      "FORCE_PHOTO_REFRESH=true — ignoring cached photo matches, re-searching everything.",
    );
  } else if (fs.existsSync(OUTPUT_PATH)) {
    try {
      const previous: JewelryItem[] = JSON.parse(
        fs.readFileSync(OUTPUT_PATH, "utf-8"),
      );
      for (const item of previous) {
        if (item.photos.length > 0 && !photoCache.has(item.styleNumber)) {
          photoCache.set(item.styleNumber, item.photos);
        }
      }
      console.log(
        `Loaded ${photoCache.size} cached photo match(es) from the previous import.`,
      );
    } catch {
      console.warn(
        "Could not read the previous catalog.json for photo caching — doing a full photo search.",
      );
    }
  }
  const items: JewelryItem[] = [];
  const usedIds = new Set<string>();
  const unrecognizedGemCodes = new Set<string>();
  let sameFileMergedCount = 0;
  let crossFileDisambiguatedCount = 0;
  let cachedPhotoCount = 0;
  let freshPhotoSearchCount = 0;
  let soldRowSkippedCount = 0;
  for (const filePath of excelFiles) {
    const fileName = path.basename(filePath);
    if (/sold/i.test(fileName)) {
      console.log(`Skipping ${filePath} (name indicates a sold-out list).`);
      continue;
    }
    console.log(`Downloading ${filePath}...`);
    const buffer = await downloadFile(config, filePath);
    const sheets = sheetsFromWorkbook(buffer);
    const { metal: fileMetal, stone: fileStone } =
      deriveMetalAndStoneFromFilename(
        path.basename(filePath, path.extname(filePath)),
      );
    let rowCount = 0;
    const fileItems = new Map<string, JewelryItem>();
    for (const { sheetName, rows } of sheets) {
      if (rows.length === 0) continue;
      const headerMap = buildHeaderMap(Object.keys(rows[0]));
      if (!headerMap.styleNumber) {
        console.warn(
          `  Skipping sheet "${sheetName}" in ${filePath}: no style/item/SKU column found.`,
        );
        console.warn(`  Headers seen: ${Object.keys(rows[0]).join(", ")}`);
        continue;
      }
      for (const row of rows) {
        const styleNumber = String(row[headerMap.styleNumber] ?? "").trim();
        if (!styleNumber) continue;
        rowCount++;
        const get = (field: string) =>
          headerMap[field]
            ? String(row[headerMap[field]] ?? "").trim()
            : undefined;
        // Both Company and Memo/Invoice filled in means this stock has
        // already been sold/invoiced out — exclude it from the site rather
        // than relying solely on whole-file "All Sold" sheets, since a row
        // can be individually sold within an otherwise-active sheet.
        if (get("company") && get("memoInvoice")) {
          soldRowSkippedCount++;
          continue;
        }
        const rawDesc = get("rawDesc") ?? "";
        const type = extractJewelryType(rawDesc);
        const stonesFromDesc = extractGemsFromText(rawDesc);
        const gemCode = get("gem");
        const decodedGemCode = gemCode ? decodeGemCode(gemCode) : undefined;
        if (gemCode && !stonesFromDesc.length && decodedGemCode === gemCode) {
          unrecognizedGemCodes.add(gemCode.toUpperCase());
        }
        const stones = stonesFromDesc.length
          ? stonesFromDesc
          : decodedGemCode
            ? [decodedGemCode]
            : fileStone
              ? [fileStone]
              : [];
        const metalLabel = decodeMetal(get("metal")) ?? fileMetal;
        const size = get("size") ?? extractInchSize(rawDesc);
        const ctw = presentWeight(get("ctw"));
        const gtw = presentWeight(get("gtw"));
        const { name, description } = buildNameAndDescription({
          metalLabel,
          type,
          stones,
          ctw,
          gtw,
          sizeText: size,
          rawDesc,
          styleNumber,
        });
        const baseId = styleNumber.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const rowQty = get("quantityAvailable")
          ? Number(get("quantityAvailable"))
          : undefined;
        const existing = fileItems.get(baseId);
        if (existing) {
          sameFileMergedCount++;
          if (rowQty !== undefined) {
            existing.quantityAvailable =
              (existing.quantityAvailable ?? 0) + rowQty;
          }
          continue;
        }
        const { photos, fromCache } = await resolvePhotos(
          immich,
          styleNumber,
          photoCache,
          { metal: metalLabel, size },
        );
        if (fromCache) cachedPhotoCount++;
        else freshPhotoSearchCount++;
        fileItems.set(baseId, {
          id: baseId,
          styleNumber,
          name: get("name") || name,
          description,
          category:
            canonicalizeCategory(get("category")) ||
            type ||
            fileStone ||
            "Uncategorized",
          metal: coarseMetal(metalLabel) ?? fileMetal,
          stone: stones.join(", ") || undefined,
          size,
          ctw,
          gtw,
          collection: get("collection"),
          closeoutYear: get("closeoutYear"),
          quantityAvailable: rowQty,
          price: get("price") ? Number(get("price")) : undefined,
          photos,
        });
      }
    }
    for (const item of fileItems.values()) {
      let id = item.id;
      if (usedIds.has(id)) {
        crossFileDisambiguatedCount++;
        let n = 2;
        while (usedIds.has(`${item.id}-${n}`)) n++;
        id = `${item.id}-${n}`;
      }
      usedIds.add(id);
      items.push({ ...item, id });
    }
    console.log(`  Parsed ${rowCount} item(s) from ${fileName}.`);
  }
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(items, null, 2));
  console.log(`Wrote ${items.length} items to ${OUTPUT_PATH}`);
  console.log(
    `  ${sameFileMergedCount} same-file duplicate row(s) merged into existing listings; ` +
      `${crossFileDisambiguatedCount} cross-file id collision(s) disambiguated; ` +
      `${soldRowSkippedCount} row(s) skipped as already sold (Company + Memo/Invoice both filled).`,
  );
  const photoCounts = { zero: 0, one: 0, many: 0 };
  for (const item of items) {
    if (item.photos.length === 0) photoCounts.zero++;
    else if (item.photos.length === 1) photoCounts.one++;
    else photoCounts.many++;
  }
  console.log(
    `  Photo match coverage: ${photoCounts.zero} item(s) with no photo, ${photoCounts.one} with exactly 1, ` +
      `${photoCounts.many} with 2+. Spot-check items with no match — filename-based matching against a flat ` +
      `Immich pool can't guarantee correctness.`,
  );
  console.log(
    `  ${cachedPhotoCount} style(s) reused a cached photo match; ${freshPhotoSearchCount} were freshly ` +
      `searched against Immich. Set FORCE_PHOTO_REFRESH=true to bypass the cache and re-verify everything.`,
  );
  if (unrecognizedGemCodes.size > 0) {
    console.warn(
      `\nWARNING: ${unrecognizedGemCodes.size} gem code(s) weren't recognized and were left as-is ` +
        `in the catalog (e.g. "stone": "TZ" instead of a full name): ${Array.from(unrecognizedGemCodes).join(", ")}`,
    );
    console.warn(
      "Add them to GEM_CODE_MAP in scripts/lib/parse.ts, then re-run the import. " +
        "Review src/data/catalog.json before publishing — gem naming is customer-facing.",
    );
  }
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
