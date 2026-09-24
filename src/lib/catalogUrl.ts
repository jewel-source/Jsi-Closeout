export type CatalogStatus = "in-stock" | "sold";
export type QtySort = "qty-asc" | "qty-desc";

export const QTY_RANGES = [
  { value: "1-9", label: "1 – 9", min: 1, max: 9 },
  { value: "10-19", label: "10 – 19", min: 10, max: 19 },
  { value: "20-49", label: "20 – 49", min: 20, max: 49 },
  { value: "50-99", label: "50 – 99", min: 50, max: 99 },
  { value: "100+", label: "100 +", min: 100, max: Infinity },
] as const;

export function parseQtyRange(value: string | undefined) {
  return QTY_RANGES.find((range) => range.value === value);
}

export function parseQtySort(value: string | undefined): QtySort {
  return value === "qty-desc" ? "qty-desc" : "qty-asc";
}

export interface CatalogQuery {
  status?: CatalogStatus;
  metal?: string;
  category?: string;
  qty?: string;
  sort?: string;
  page?: number;
}

export function buildCatalogHref({
  status,
  metal,
  category,
  qty,
  sort,
  page,
}: CatalogQuery): string {
  const params = new URLSearchParams();
  if (status === "sold") params.set("status", "sold");
  if (metal) params.set("metal", metal);
  if (category) params.set("category", category);
  if (qty && status !== "sold") params.set("qty", qty);
  if (sort === "qty-desc" && status !== "sold") params.set("sort", "qty-desc");
  if (page && page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}
