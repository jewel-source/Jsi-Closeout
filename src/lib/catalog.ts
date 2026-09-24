import fs from "fs";
import path from "path";
import type { JewelryItem } from "./types";
const GENERATED_PATH = path.join(process.cwd(), "src/data/catalog.json");
const SAMPLE_PATH = path.join(process.cwd(), "src/data/catalog.sample.json");
let cached: { items: JewelryItem[]; mtimeMs: number; path: string } | null = null;
export function getCatalog(): JewelryItem[] {
  if (cached && process.env.NODE_ENV === "production") return cached.items;
  const sourcePath = fs.existsSync(GENERATED_PATH)
    ? GENERATED_PATH
    : SAMPLE_PATH;
  const mtimeMs = fs.statSync(sourcePath).mtimeMs;
  if (cached && cached.path === sourcePath && cached.mtimeMs === mtimeMs) {
    return cached.items;
  }
  const raw = fs.readFileSync(sourcePath, "utf-8");
  cached = { items: JSON.parse(raw) as JewelryItem[], mtimeMs, path: sourcePath };
  return cached.items;
}
export function getItem(id: string): JewelryItem | undefined {
  return getCatalog().find((item) => item.id === id);
}
export function getCategories(items: JewelryItem[] = getCatalog()): string[] {
  const categories = new Set(items.map((item) => item.category));
  return Array.from(categories).sort();
}
export function getMetals(items: JewelryItem[] = getCatalog()): string[] {
  const metals = new Set(
    items
      .map((item) => item.metal)
      .filter((m): m is string => Boolean(m)),
  );
  return Array.from(metals).sort();
}
