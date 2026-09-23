import { getCatalog, getCategories, getMetals } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";

const PAGE_SIZE = 24;

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const selectedMetal = typeof params.metal === "string" ? params.metal : undefined;
  const selectedCategory = typeof params.category === "string" ? params.category : undefined;

  const catalog = getCatalog();
  const metals = getMetals();
  const categories = getCategories();
  const items = catalog.filter((item) => {
    if (selectedMetal && item.metal !== selectedMetal) return false;
    if (selectedCategory && item.category !== selectedCategory) return false;
    return true;
  });

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
            {selectedMetal || selectedCategory ? " match your filters" : " available"}
            {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <FilterBar
          metals={metals}
          categories={categories}
          selectedMetal={selectedMetal}
          selectedCategory={selectedCategory}
        />

        <div className="mt-6 sm:mt-8">
          {items.length === 0 ? (
            <p className="text-[var(--foreground)]/60">No items found.</p>
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
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
