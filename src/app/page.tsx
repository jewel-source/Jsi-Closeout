import Link from "next/link";
import { getCatalog, getCategories, getMetals } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";
function buildHref(metal: string | undefined, category: string | undefined) {
  const params = new URLSearchParams();
  if (metal) params.set("metal", metal);
  if (category) params.set("category", category);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}
function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-full text-sm border ${active ? "bg-black text-white border-black" : "border-black/20 hover:bg-black/5"}`}
    >
      {children}
    </Link>
  );
}
export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const selectedMetal =
    typeof params.metal === "string" ? params.metal : undefined;
  const selectedCategory =
    typeof params.category === "string" ? params.category : undefined;
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
        <h1 className="text-3xl font-semibold tracking-tight">
          Closeout Jewelry Catalog
        </h1>
        <p className="text-black/60 mt-2 max-w-2xl">
          Browse our current closeout inventory. Add pieces you&apos;re
          interested in and submit a quote request — we&apos;ll get back to you
          with pricing and availability.
        </p>
      </div>

      {metals.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          <FilterChip
            href={buildHref(undefined, selectedCategory)}
            active={!selectedMetal}
          >
            All Metals
          </FilterChip>
          {metals.map((metal) => (
            <FilterChip
              key={metal}
              href={buildHref(metal, selectedCategory)}
              active={selectedMetal === metal}
            >
              {metal}
            </FilterChip>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-8">
        <FilterChip
          href={buildHref(selectedMetal, undefined)}
          active={!selectedCategory}
        >
          All Categories
        </FilterChip>
        {categories.map((cat) => (
          <FilterChip
            key={cat}
            href={buildHref(selectedMetal, cat)}
            active={selectedCategory === cat}
          >
            {cat}
          </FilterChip>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-black/60">No items found.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
