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
function normalizeCode(code: string): string {
  return code.replace(/\s+/g, "").toUpperCase();
}
function extractLeadingCode(normalizedBase: string): string {
  const match = normalizedBase.match(/^[A-Z0-9]+/);
  return match ? match[0] : normalizedBase;
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
function pickBestMatch(sku: string, candidates: ImmichAsset[]): ImmichAsset[] {
  if (candidates.length === 0) return [];
  const groups = new Map<string, ImmichAsset[]>();
  for (const asset of candidates) {
    const code = extractLeadingCode(
      normalizeCode(stripExtension(asset.originalFileName)),
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
  if (best.distance === 0) return best.assets;
  if (best.distance > maxAllowedDistance(sku.length)) return [];
  const runnerUp = scored[1];
  if (runnerUp && runnerUp.distance === best.distance) return [];
  if (best.assets.length > MAX_FUZZY_GROUP_SIZE) return [];
  return best.assets;
}
function rankKey(
  originalFileName: string,
  matchedCode: string,
): [number, number, string] {
  const base = normalizeCode(stripExtension(originalFileName));
  if (base === matchedCode) return [0, 0, ""];
  const suffix = base.slice(matchedCode.length).replace(/^[^A-Z0-9]+/, "");
  const numericMatch = suffix.match(/^(\d+)/);
  if (numericMatch) return [1, parseInt(numericMatch[1], 10), suffix];
  return [2, 0, suffix];
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
): Promise<ImmichAsset[]> {
  const sku = normalizeCode(rawStyleNumber);
  const letterStripped = searchAnchor(sku);
  const anchors = new Set([sku, letterStripped]);
  if (letterStripped.length > 6) anchors.add(letterStripped.slice(0, -2));
  const candidates = new Map<string, ImmichAsset>();
  for (const anchor of anchors) {
    for (const asset of await searchRaw(config, anchor)) {
      candidates.set(asset.id, asset);
    }
  }
  const matches = pickBestMatch(sku, [...candidates.values()]);
  if (matches.length === 0) return matches;
  const matchedCode = extractLeadingCode(
    normalizeCode(stripExtension(matches[0].originalFileName)),
  );
  matches.sort((a, b) =>
    compareRankKeys(
      rankKey(a.originalFileName, matchedCode),
      rankKey(b.originalFileName, matchedCode),
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
