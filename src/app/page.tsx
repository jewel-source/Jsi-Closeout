import { getCatalog, getCategories, getMetals } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import StatusTabs from "@/components/StatusTabs";
import {
  buildCatalogHref,
  parseQtyRange,
  parseQtySort,
  type CatalogStatus,
} from "@/lib/catalogUrl";
import Link from "next/link";

const PAGE_SIZE = 24;

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const selectedMetal = typeof params.metal === "string" ? params.metal : undefined;
  const selectedCategory = typeof params.category === "string" ? params.category : undefined;

  const qtyRange = parseQtyRange(typeof params.qty === "string" ? params.qty : undefined);
  const qtySort = parseQtySort(typeof params.sort === "string" ? params.sort : undefined);
  const status: CatalogStatus = params.status === "sold" ? "sold" : "in-stock";

  const catalog = getCatalog();
  const statusItems = catalog.filter((item) => Boolean(item.soldOut) === (status === "sold"));
  const metals = getMetals(statusItems);
  const categories = getCategories(statusItems);
  const matchesFilters = (item: (typeof catalog)[number]) =>
    (!selectedMetal || item.metal === selectedMetal) &&
    (!selectedCategory || item.category === selectedCategory);
  const inQtyRange = (item: (typeof catalog)[number]) =>
    !qtyRange ||
    (item.quantityAvailable !== undefined &&
      item.quantityAvailable >= qtyRange.min &&
      item.quantityAvailable <= qtyRange.max);
  const items = statusItems.filter(
    (item) => matchesFilters(item) && (status === "sold" || inQtyRange(item)),
  );
  if (status === "in-stock") {
    const direction = qtySort === "qty-desc" ? -1 : 1;
    items.sort(
      (a, b) =>
        direction * ((a.quantityAvailable ?? Infinity) - (b.quantityAvailable ?? Infinity)),
    );
  }
  const counts: Record<CatalogStatus, number> = {
    "in-stock": catalog.filter(
      (item) => !item.soldOut && matchesFilters(item) && inQtyRange(item),
    ).length,
    sold: catalog.filter((item) => item.soldOut && matchesFilters(item)).length,
  };

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const requestedPage = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const page = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), totalPages)
    : 1;
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <section className="hero-band">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-20">
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight mt-3 text-[var(--color-footer)]">
            Jewelry <span className="brand-gradient-text">Catalog</span>
          </h1>
          <p className="text-[var(--foreground)]/70 mt-4 max-w-2xl text-base sm:text-lg leading-relaxed">
            Browse our current inventory. Add pieces you&apos;re interested in and submit a
            quote request we&apos;ll get back to you with pricing and availability.
          </p>
          <p className="mt-6 text-sm text-[var(--foreground)]/55">
            {items.length.toLocaleString()} {items.length === 1 ? "piece" : "pieces"}
            {selectedMetal || selectedCategory || (status === "in-stock" && qtyRange)
              ? " match your filters"
              : status === "sold"
                ? " sold out — available to reorder"
                : " in stock"}
            {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <StatusTabs
            status={status}
            counts={counts}
            metal={selectedMetal}
            category={selectedCategory}
          />
          <FilterBar
            metals={metals}
            categories={categories}
            selectedMetal={selectedMetal}
            selectedCategory={selectedCategory}
            selectedQty={status === "in-stock" ? qtyRange?.value : undefined}
            selectedSort={status === "in-stock" ? qtySort : undefined}
            status={status}
          />
        </div>

        <div className="mt-6 sm:mt-8">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-accent)]/25 bg-[var(--color-tint)] p-10 text-center">
              <p className="text-[var(--foreground)]/70">
                No {status === "sold" ? "sold-out" : "in-stock"} pieces match these filters.
              </p>
              <Link
                href={buildCatalogHref({ status })}
                className="mt-3 inline-block text-sm font-medium text-[var(--color-accent-dark)] hover:underline"
              >
                Clear filters
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {pageItems.map((item) => (
                  <ProductCard key={item.id} item={item} />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                metal={selectedMetal}
                category={selectedCategory}
                qty={status === "in-stock" ? qtyRange?.value : undefined}
                sort={status === "in-stock" ? qtySort : undefined}
                status={status}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
