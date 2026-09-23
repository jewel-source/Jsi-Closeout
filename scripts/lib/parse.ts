export const METAL_CODE_MAP: Record<string, string> = {
  SS: "Sterling Silver",
};
export const GEM_CODE_MAP: Record<string, string> = {
  AQ: "Aquamarine",
  TZ: "Tanzanite",
  RB: "Ruby",
  EM: "Emerald",
  SPH: "Sapphire",
  SAP: "Sapphire",
  CZ: "Cubic Zirconia",
  DIA: "Diamond",
  PRL: "Pearl",
  OP: "Opal",
  EOP: "Ethiopian Opal",
  AM: "Amethyst",
  AMY: "Amethyst",
  AMET: "Amethyst",
  CIT: "Citrine",
  GN: "Garnet",
  GAR: "Garnet",
  RHO: "Rhodolite",
  PD: "Peridot",
  PER: "Peridot",
  MS: "Moonstone",
  TQ: "Turquoise",
  MG: "Morganite",
  MOR: "Morganite",
  IOL: "Iolite",
  APT: "Apatite",
  BT: "Blue Topaz",
  SBT: "Swiss Blue Topaz",
  LBT: "London Blue Topaz",
  TPZ: "Topaz",
  SP: "Spinel",
  STQ: "Smoky Quartz",
  SMQ: "Smoky Quartz",
  LAB: "Labradorite",
  ALX: "Alexandrite",
  KUN: "Kunzite",
  HEL: "Heliodor",
  COR: "Coral",
  LAR: "Larimar",
  MAL: "Malachite",
  ZUL: "Zultanite",
  ZIR: "Zircon",
  "CH DIOP": "Chrome Diopside",
  TO: "Topaz",
  MUL: "Multi-Gemstone",
  SA: "Sapphire",
  SPNL: "Spinel",
};
const COLOR_PREFIXES: Record<string, string> = {
  BLK: "Black",
  BL: "Blue",
  PNK: "Pink",
  PK: "Pink",
  WH: "White",
  YL: "Yellow",
  GR: "Green",
};
const GEM_SUFFIXES: Record<string, string> = {
  SA: "Sapphire",
  ZIR: "Zircon",
  TPZ: "Topaz",
  SPNL: "Spinel",
  AMY: "Amethyst",
  OP: "Opal",
  QTZ: "Quartz",
};
function decodeCompositeGemCode(code: string): string | undefined {
  const upper = code.toUpperCase();
  for (const [prefix, color] of Object.entries(COLOR_PREFIXES)) {
    if (upper.startsWith(prefix) && GEM_SUFFIXES[upper.slice(prefix.length)]) {
      return `${color} ${GEM_SUFFIXES[upper.slice(prefix.length)]}`;
    }
  }
  return undefined;
}
function decodeSlashGemCode(code: string): string | undefined {
  if (!code.includes("/")) return undefined;
  const parts = code.split("/").map((p) => p.trim());
  const decoded = parts.map(
    (p) => GEM_CODE_MAP[p] ?? decodeCompositeGemCode(p),
  );
  return decoded.every(Boolean) ? decoded.join(" & ") : undefined;
}
export function decodeGemCode(code: string): string {
  const upper = code.toUpperCase();
  const alreadyFullWord = GEM_KEYWORDS.find((g) => g.pattern.toUpperCase() === upper)?.label;
  return (
    alreadyFullWord ??
    GEM_CODE_MAP[upper] ??
    decodeCompositeGemCode(upper) ??
    decodeSlashGemCode(upper) ??
    code
  );
}
export const GEM_KEYWORDS: { pattern: string; label: string }[] = [
  { pattern: "Cubic Zirconia", label: "Cubic Zirconia" },
  { pattern: "White Zircon", label: "White Zircon" },
  { pattern: "Aquamarine", label: "Aquamarine" },
  { pattern: "Tanzanite", label: "Tanzanite" },
  { pattern: "Sapphire", label: "Sapphire" },
  { pattern: "Emerald", label: "Emerald" },
  { pattern: "Morganite", label: "Morganite" },
  { pattern: "Moonstone", label: "Moonstone" },
  { pattern: "Turquoise", label: "Turquoise" },
  { pattern: "Amethyst", label: "Amethyst" },
  { pattern: "Citrine", label: "Citrine" },
  { pattern: "Peridot", label: "Peridot" },
  { pattern: "Garnet", label: "Garnet" },
  { pattern: "Zultanite", label: "Zultanite" },
  { pattern: "Zircon", label: "Zircon" },
  // "Diam"/"Dia" are extremely standard trade abbreviations for Diamond —
  // matched alongside the full word since sheets use both interchangeably.
  { pattern: "Diamonds?", label: "Diamond" },
  { pattern: "Diam", label: "Diamond" },
  { pattern: "Dia", label: "Diamond" },
  { pattern: "Topaz", label: "Topaz" },
  { pattern: "Quartz", label: "Quartz" },
  { pattern: "Ruby", label: "Ruby" },
  { pattern: "Pearl", label: "Pearl" },
  { pattern: "Opal", label: "Opal" },
  { pattern: "Onyx", label: "Onyx" },
  { pattern: "Iolite", label: "Iolite" },
].sort((a, b) => b.pattern.length - a.pattern.length);
export const JEWELRY_TYPE_KEYWORDS: {
  pattern: string;
  label: string;
}[] = [
  { pattern: "Earrings?", label: "Earrings" },
  { pattern: "Bracelets?", label: "Bracelets" },
  { pattern: "Necklaces?", label: "Necklaces" },
  { pattern: "Pendants?", label: "Pendants" },
  { pattern: "Bangles?", label: "Bangles" },
  { pattern: "Anklets?", label: "Anklets" },
  { pattern: "Brooch(es)?", label: "Brooches" },
  { pattern: "Cuffs?", label: "Cuffs" },
  { pattern: "Charms?", label: "Charms" },
  { pattern: "Chains?", label: "Chains" },
  { pattern: "Studs?", label: "Studs" },
  { pattern: "Rings?", label: "Rings" },
];
export function titleCase(s: string): string {
  return s.toLowerCase().replace(/(^|[\s-])\S/g, (c) => c.toUpperCase());
}
export function extractGemsFromText(text: string): string[] {
  let working = ` ${text.toUpperCase()} `;
  const found: string[] = [];
  for (const { pattern, label } of GEM_KEYWORDS) {
    if (found.includes(label)) continue; // e.g. both "Diamond" and "Diam" matching the same text
    const regex = new RegExp(`\\b${pattern.toUpperCase()}\\b`);
    if (regex.test(working)) {
      found.push(label);
      working = working.replace(regex, " ");
    }
  }
  return found;
}
export function extractJewelryType(text: string): string | undefined {
  const upper = text.toUpperCase();
  for (const { pattern, label } of JEWELRY_TYPE_KEYWORDS) {
    if (new RegExp(`\\b${pattern.toUpperCase()}\\b`).test(upper)) return label;
  }
  return undefined;
}
export function canonicalizeCategory(
  raw: string | undefined,
): string | undefined {
  if (!raw?.trim()) return undefined;
  return extractJewelryType(raw) ?? titleCase(raw.trim());
}
export function extractInchSize(text: string): string | undefined {
  const match = text.match(/(\d+(?:\.\d+)?)\s*"/);
  return match ? `${match[1]}"` : undefined;
}
export function decodeMetal(code: string | undefined): string | undefined {
  if (!code) return undefined;
  const upper = code.toUpperCase();
  if (METAL_CODE_MAP[upper]) return METAL_CODE_MAP[upper];
  if (/^\d+K$/.test(upper)) return `${upper} Gold`;
  return code;
}
export function coarseMetal(
  metalLabel: string | undefined,
): string | undefined {
  if (!metalLabel) return undefined;
  if (/gold/i.test(metalLabel)) return "Gold";
  if (/silver/i.test(metalLabel)) return "Silver";
  if (/platinum/i.test(metalLabel)) return "Platinum";
  // Karat+color gold shorthand never contains the word "gold" itself, e.g.
  // "14KY" (yellow), "10KRG" (rose), "14KTT" (two-tone), "18KWG" (white).
  if (/^\d+\s?K/i.test(metalLabel.trim())) return "Gold";
  return metalLabel;
}
function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}
export function buildNameAndDescription(parts: {
  metalLabel?: string;
  type?: string;
  stones: string[];
  ctw?: string;
  gtw?: string;
  sizeText?: string;
  rawDesc?: string;
  styleNumber: string;
}): {
  name: string;
  description: string;
} {
  const typeLabel = parts.type ?? "Piece";
  const stonePart = parts.stones.length ? parts.stones.join(" & ") : undefined;
  const nameBits = [parts.metalLabel, stonePart, typeLabel].filter(Boolean);
  const name = nameBits.length ? nameBits.join(" ") : parts.styleNumber;
  if (!parts.metalLabel && !parts.type && parts.stones.length === 0) {
    return { name, description: parts.rawDesc || "" };
  }
  let sentence = `${parts.metalLabel ?? ""} ${typeLabel}`.trim();
  if (stonePart) sentence += ` featuring ${stonePart}`;
  // GTW is the gemstone's own weight, CTW is diamond-accent weight — a piece
  // can have either, or both at once (e.g. a colored stone with a pave
  // diamond halo), so each is reported separately rather than picking one.
  if (parts.gtw) sentence += `, total gem weight ${parts.gtw} ctw`;
  if (parts.ctw) {
    sentence += parts.gtw
      ? ` plus ${parts.ctw} ctw diamond accents`
      : `, total weight ${parts.ctw} ctw`;
  }
  if (parts.sizeText) sentence += `, size ${parts.sizeText}`;
  sentence += ".";
  return { name, description: capitalize(sentence) };
}
export function deriveMetalAndStoneFromFilename(fileBaseName: string): {
  metal?: string;
  stone?: string;
} {
  const parts = fileBaseName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  if (!/^(gold|silver)$/i.test(parts[0])) return {};
  const metal = titleCase(parts[0]);
  const stoneRaw = parts.slice(1).join(" ").replace(/-+$/, "").trim();
  return { metal, stone: stoneRaw ? titleCase(stoneRaw) : undefined };
}
