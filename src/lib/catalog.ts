import fs from "fs";
import path from "path";
import type { JewelryItem } from "./types";
const GENERATED_PATH = path.join(process.cwd(), "src/data/catalog.json");
const SAMPLE_PATH = path.join(process.cwd(), "src/data/catalog.sample.json");
let cached: JewelryItem[] | null = null;
export function getCatalog(): JewelryItem[] {
  if (cached) return cached;
  const sourcePath = fs.existsSync(GENERATED_PATH)
    ? GENERATED_PATH
    : SAMPLE_PATH;
  const raw = fs.readFileSync(sourcePath, "utf-8");
  cached = JSON.parse(raw) as JewelryItem[];
  return cached;
}
export function getItem(id: string): JewelryItem | undefined {
  return getCatalog().find((item) => item.id === id);
}
export function getCategories(): string[] {
  const categories = new Set(getCatalog().map((item) => item.category));
  return Array.from(categories).sort();
}
export function getMetals(): string[] {
  const metals = new Set(
    getCatalog()
      .map((item) => item.metal)
      .filter((m): m is string => Boolean(m)),
  );
  return Array.from(metals).sort();
}
