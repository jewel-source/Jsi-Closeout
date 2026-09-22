export interface ImmichAsset {
  id: string;
  originalFileName: string;
}
export interface ImmichConfig {
  baseUrl: string;
  apiKey: string;
}
function authHeaders(config: ImmichConfig) {
  return {
    "x-api-key": config.apiKey,
    Accept: "application/json",
  };
}
function stripExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx === -1 ? filename : filename.slice(0, idx);
}
const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
  "avif",
  "gif",
  "bmp",
  "tiff",
]);
function isImageFile(filename: string): boolean {
  const ext = filename.slice(filename.lastIndexOf(".") + 1).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}
/** Style numbers from the spreadsheet get any incidental whitespace collapsed away entirely. */
function normalizeSku(code: string): string {
  return code.replace(/\s+/g, "").toUpperCase();
}
/**
 * Photo filenames keep internal whitespace, unlike normalizeSku — a bare
 * space is as valid a separator as "_"/"-" between a style code and a
 * description ("JSBG010A258725 FRONT.jpg"), so stripping it away would glue
 * the code and description into one unmatchable blob.
 */
function normalizeFilenameBase(name: string): string {
  return name.trim().toUpperCase();
}
function extractLeadingCode(normalizedBase: string): string {
  const match = normalizedBase.match(/^[A-Z0-9]+/);
  return match ? match[0] : normalizedBase;
}
function extractTrailingCode(normalizedBase: string): string {
  const match = normalizedBase.match(/[A-Z0-9]+$/);
  return match ? match[0] : normalizedBase;
}
/**
 * Some filenames split a code that's written as one unbroken token in the
 * spreadsheet across an internal delimiter — "JP02579P CR.AQ.jpg" for style
 * "JP02579PCRAQ" — so neither the leading nor trailing chunk alone is long
 * enough to resemble the sku. Stripping every delimiter (not just leading
 * whitespace) reassembles it as "JP02579PCRAQ", an exact match. This also
 * naturally keeps each gem-code variant of a shared base as its own group
 * ("JP02579PCRAQ" vs "JP02579PCRRB" vs "JP02579PCREM", ...) instead of
 * lumping them under one shared prefix the way leading-code grouping would.
 */
function extractFullyStrippedCode(normalizedBase: string): string {
  return normalizedBase.replace(/[^A-Z0-9]/g, "");
}
function levenshteinDistance(a: string, b: string): number {
  const dp: number[] = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prevDiag = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = dp[j];
      dp[j] =
        a[i - 1] === b[j - 1]
          ? prevDiag
          : 1 + Math.min(prevDiag, dp[j], dp[j - 1]);
      prevDiag = temp;
    }
  }
  return dp[b.length];
}
function maxAllowedDistance(length: number): number {
  return Math.max(1, Math.round(length * 0.2));
}
const MAX_FUZZY_GROUP_SIZE = 15;
function pickBestMatchFor(
  sku: string,
  candidates: ImmichAsset[],
  extractCode: (base: string) => string,
): { code: string; assets: ImmichAsset[] } | undefined {
  const groups = new Map<string, ImmichAsset[]>();
  for (const asset of candidates) {
    const code = extractCode(
      normalizeFilenameBase(stripExtension(asset.originalFileName)),
    );
    const group = groups.get(code);
    if (group) group.push(asset);
    else groups.set(code, [asset]);
  }
  const scored = [...groups.entries()]
    .map(([code, assets]) => ({
      code,
      assets,
      distance: levenshteinDistance(sku, code),
    }))
    .sort((a, b) => a.distance - b.distance);
  const best = scored[0];
  if (best.distance === 0) return best;
  if (best.distance > maxAllowedDistance(sku.length)) return undefined;
  const runnerUp = scored[1];
  if (runnerUp && runnerUp.distance === best.distance) return undefined;
  if (best.assets.length > MAX_FUZZY_GROUP_SIZE) return undefined;
  return best;
}
/**
 * A style line can photograph many variants (one per letter, color, etc.)
 * under one shared base code, with only the free-text description telling
 * them apart — "AAE010A0168A - A-FrontView.jpg" ... "- Z.jpg", one per
 * letter, for style numbers "AAE010A0168A" + "<letter>". pickBestMatchFor's
 * size cap correctly refuses to guess across a whole such cluster (many
 * candidates, no way to tell which one this specific sku means) — but the
 * sku's own leftover suffix after the shared code ("A", "B", ...) usually
 * *is* readable, as its own delimited token, in each candidate's
 * description. Only engages when there's a substantial (8+ char) shared
 * prefix and a short (<=3 char) leftover, and only trusts a candidate when
 * that exact token is found delimited in its description — so an unrelated
 * shared-prefix cluster with no such embedded evidence still correctly
 * falls through to "no match" rather than guessing.
 */
function pickByEmbeddedSuffix(
  sku: string,
  candidates: ImmichAsset[],
): { code: string; assets: ImmichAsset[] } | undefined {
  const byCode = new Map<string, ImmichAsset[]>();
  for (const asset of candidates) {
    const base = normalizeFilenameBase(stripExtension(asset.originalFileName));
    const code = extractLeadingCode(base);
    if (code.length < 8 || !sku.startsWith(code)) continue;
    const remainder = sku.slice(code.length);
    if (!remainder || remainder.length > 3) continue;
    const rest = base.slice(code.length);
    if (new RegExp(`(?:^|[^A-Z0-9])${remainder}(?:[^A-Z0-9]|$)`).test(rest)) {
      const group = byCode.get(code);
      if (group) group.push(asset);
      else byCode.set(code, [asset]);
    }
  }
  const entries = [...byCode.entries()];
  return entries.length === 1 ? { code: entries[0][0], assets: entries[0][1] } : undefined;
}
/**
 * Tries, in order: leading code ("CODE - description" / "CODE description",
 * the layout every real case has mostly used), trailing code ("description
 * CODE"), the fully-delimiter-stripped whole filename (for a code split
 * across an internal delimiter that's unbroken in the sku), then a shared
 * base code disambiguated by a token embedded in the description. Each pass
 * groups *consistently* (always the same extraction rule) rather than
 * picking per-asset, since a per-asset choice fragments what should be one
 * cohesive multi-photo group whenever a couple of its filenames happen to
 * have a closer-looking alternate token.
 */
function pickBestMatch(
  sku: string,
  candidates: ImmichAsset[],
): { code: string; assets: ImmichAsset[] } | undefined {
  if (candidates.length === 0) return undefined;
  return (
    pickBestMatchFor(sku, candidates, extractLeadingCode) ??
    pickBestMatchFor(sku, candidates, extractTrailingCode) ??
    pickBestMatchFor(sku, candidates, extractFullyStrippedCode) ??
    pickByEmbeddedSuffix(sku, candidates)
  );
}
function rankKey(
  originalFileName: string,
  matchedCode: string,
): [number, number, string] {
  const base = normalizeFilenameBase(stripExtension(originalFileName));
  if (base === matchedCode) return [0, 0, ""];
  if (base.startsWith(matchedCode)) {
    const suffix = base.slice(matchedCode.length).replace(/^[^A-Z0-9]+/, "");
    const numericMatch = suffix.match(/^(\d+)/);
    if (numericMatch) return [1, parseInt(numericMatch[1], 10), suffix];
    return [2, 0, suffix];
  }
  if (base.endsWith(matchedCode)) {
    const prefix = base
      .slice(0, base.length - matchedCode.length)
      .replace(/[^A-Z0-9]+$/, "");
    return [2, 0, prefix];
  }
  return [3, 0, base];
}
function compareRankKeys(
  a: [number, number, string],
  b: [number, number, string],
): number {
  if (a[0] !== b[0]) return a[0] - b[0];
  if (a[1] !== b[1]) return a[1] - b[1];
  return a[2].localeCompare(b[2]);
}
function searchAnchor(sku: string): string {
  const match = sku.match(/^(.*\d)[A-Za-z]*$/);
  return match ? match[1] : sku;
}
export interface PhotoMatchContext {
  metal?: string;
  size?: string;
}
/**
 * Some lines photograph each metal-color plating of a shared base as its own
 * filename, tagging it right after the base code with no delimiter (e.g.
 * "JSB015A1415RP725.jpg" for rose-plated, "...YP725..." for yellow-plated),
 * while the plain/undyed base variant carries no tag at all. Read purely by
 * edit distance, a sku with no tag of its own (e.g. from a Silver row) can
 * come out numerically *closer* to a tagged variant than to the correct
 * plain one, and a tagged variant can tie against another tagged variant,
 * so this can't be left to plain distance scoring. Mapping the item's own
 * Metal column to the tag its photos would carry lets a later pass build a
 * sku variant that targets the correct group directly. An unrecognized or
 * absent color word maps to "no tag", matching the plain/silver case.
 */
function expectedFilenameMetalMarker(rawMetal: string | undefined): string | undefined {
  if (!rawMetal) return undefined;
  const upper = rawMetal.toUpperCase();
  if (/ROSE|\bRG\b/.test(upper)) return "RP";
  if (/YELLOW|\bYG\b|\dK\s*Y(?:G)?\b/.test(upper)) return "YP";
  if (/WHITE|\bWG\b|\dK\s*W(?:G)?\b/.test(upper)) return "WP";
  if (/TWO.?TONE|\bTT\b/.test(upper)) return "TT";
  return undefined;
}
/**
 * Some skus embed the item's own size as a trailing numeric suffix that the
 * matching plain/base photo never carries (the size only shows up on
 * metal-plating-tagged variants, if at all) — "JSB015A1415725" for a 7.25"
 * Silver bracelet whose photos are just "JSB015A1415.jpg" and friends.
 * Recognizing the item's own Size column lets us strip that suffix (and,
 * when a plating tag is expected, rebuild the sku the way that variant's
 * photos are actually named) to search and score against, without ever
 * guessing this for skus where the size just doesn't happen to appear as a
 * literal trailing-digit suffix.
 */
function buildContextSkuVariants(
  sku: string,
  context: PhotoMatchContext | undefined,
): string[] {
  if (!context?.size) return [];
  const sizeDigits = context.size.replace(/[^0-9]/g, "");
  if (!sizeDigits || sku.length <= sizeDigits.length || !sku.endsWith(sizeDigits)) {
    return [];
  }
  const coreSku = sku.slice(0, -sizeDigits.length);
  if (coreSku.length < 6) return [];
  const marker = expectedFilenameMetalMarker(context.metal);
  if (!marker) return [coreSku];
  return [coreSku + marker + sizeDigits, coreSku + marker];
}
const FILENAME_METAL_MARKERS = ["RP", "YP", "WP", "TT"];
function remainderHasMarker(remainder: string, marker: string): boolean {
  const tokens = remainder.match(/[A-Z]+/g) ?? [];
  return tokens.some(
    (token) => token === marker || (token.length > 2 && token.endsWith(marker)),
  );
}
function remainderHasAnyMarker(remainder: string): boolean {
  return FILENAME_METAL_MARKERS.some((marker) => remainderHasMarker(remainder, marker));
}
/**
 * A shared base code's whole group (as extractLeadingCode groups it, i.e.
 * everything up to the first delimiter) can mix several metal-plating
 * variants together — "JSB015A1415 back.jpg" (plain), "...backRP.jpg"
 * (rose-plated), "...backYP.jpg" (yellow-plated) all share the leading code
 * "JSB015A1415", with the plating marker showing up later, as its own
 * token or fused onto the end of a description word. A plain exact-code
 * match would silently hand back the whole mixed bag. This narrows it to
 * just the variant the item's own Metal column implies, by scanning each
 * candidate's remainder for a plating marker (or, for a plain/silver item,
 * requiring none be present) — the same "trust an embedded, delimited
 * token, don't guess otherwise" approach as pickByEmbeddedSuffix.
 */
function pickByMetalContext(
  sku: string,
  candidates: ImmichAsset[],
  context: PhotoMatchContext | undefined,
): { code: string; assets: ImmichAsset[] } | undefined {
  if (!context?.size) return undefined;
  const sizeDigits = context.size.replace(/[^0-9]/g, "");
  if (!sizeDigits || sku.length <= sizeDigits.length || !sku.endsWith(sizeDigits)) {
    return undefined;
  }
  const coreSku = sku.slice(0, -sizeDigits.length);
  if (coreSku.length < 6) return undefined;
  const expectedMarker = expectedFilenameMetalMarker(context.metal);
  const matches: ImmichAsset[] = [];
  for (const asset of candidates) {
    const base = normalizeFilenameBase(stripExtension(asset.originalFileName));
    const code = extractLeadingCode(base);
    if (code !== coreSku) continue;
    const remainder = base.slice(code.length);
    const isMatch = expectedMarker
      ? remainderHasMarker(remainder, expectedMarker)
      : !remainderHasAnyMarker(remainder);
    if (isMatch) matches.push(asset);
  }
  return matches.length > 0 ? { code: coreSku, assets: matches } : undefined;
}
async function searchRaw(
  config: ImmichConfig,
  query: string,
): Promise<ImmichAsset[]> {
  const res = await fetch(
    `${config.baseUrl.replace(/\/$/, "")}/search/metadata`,
    {
      method: "POST",
      headers: { ...authHeaders(config), "Content-Type": "application/json" },
      body: JSON.stringify({ originalFileName: query, page: 1, size: 50 }),
    },
  );
  if (!res.ok) {
    throw new Error(
      `Immich search failed for "${query}": ${res.status} ${await res.text()}`,
    );
  }
  const data = (await res.json()) as unknown;
  return extractAssetItems(data).filter(
    (a) => a.originalFileName && isImageFile(a.originalFileName),
  );
}
export async function searchAssetsByFilename(
  config: ImmichConfig,
  rawStyleNumber: string,
  context?: PhotoMatchContext,
): Promise<ImmichAsset[]> {
  const sku = normalizeSku(rawStyleNumber);
  const letterStripped = searchAnchor(sku);
  const contextVariants = buildContextSkuVariants(sku, context);
  const anchors = new Set([sku, letterStripped, ...contextVariants]);
  if (letterStripped.length > 6) anchors.add(letterStripped.slice(0, -2));
  for (const variant of contextVariants) {
    if (variant.length > 6) anchors.add(variant.slice(0, -2));
  }
  const candidates = new Map<string, ImmichAsset>();
  for (const anchor of anchors) {
    for (const asset of await searchRaw(config, anchor)) {
      candidates.set(asset.id, asset);
    }
  }
  const pool = [...candidates.values()];
  let best = pickBestMatch(sku, pool);
  if (!best) best = pickByMetalContext(sku, pool, context);
  if (!best) {
    for (const variant of contextVariants) {
      best = pickBestMatch(variant, pool);
      if (best) break;
    }
  }
  if (!best) return [];
  const matches = best.assets;
  matches.sort((a, b) =>
    compareRankKeys(
      rankKey(a.originalFileName, best.code),
      rankKey(b.originalFileName, best.code),
    ),
  );
  return matches;
}
function extractAssetItems(data: unknown): ImmichAsset[] {
  if (Array.isArray(data)) return data as ImmichAsset[];
  const obj = data as Record<string, unknown>;
  const assets = obj?.assets as Record<string, unknown> | undefined;
  if (assets?.items && Array.isArray(assets.items))
    return assets.items as ImmichAsset[];
  if (obj?.items && Array.isArray(obj.items)) return obj.items as ImmichAsset[];
  return [];
}
