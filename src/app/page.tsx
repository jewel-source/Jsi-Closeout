import { getCatalog, getCategories, getMetals } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";
import FilterSidebar from "@/components/FilterSidebar";

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[var(--color-footer)]">
          Closeout Jewelry Catalog
        </h1>
        <p className="text-[var(--foreground)]/70 mt-2 max-w-2xl">
          Browse our current closeout inventory. Add pieces you&apos;re interested in and submit a
          quote request — we&apos;ll get back to you with pricing and availability.
        </p>
      </div>

      <div className="sm:flex sm:items-start sm:gap-8">
        <FilterSidebar
          metals={metals}
          categories={categories}
          selectedMetal={selectedMetal}
          selectedCategory={selectedCategory}
        />

        <div className="flex-1 mt-6 sm:mt-0">
          {items.length === 0 ? (
            <p className="text-[var(--foreground)]/60">No items found.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {items.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
