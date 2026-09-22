import Link from "next/link";
import LinkPendingSpinner from "./LinkPendingSpinner";

function buildHref(metal: string | undefined, category: string | undefined) {
  const params = new URLSearchParams();
  if (metal) params.set("metal", metal);
  if (category) params.set("category", category);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

function FilterLink({
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
      className={`flex items-center px-2 py-1.5 rounded text-sm ${
        active
          ? "bg-[var(--color-accent)] text-white font-medium"
          : "text-[var(--foreground)]/75 hover:bg-[var(--color-accent)]/10"
      }`}
    >
      {children}
      <LinkPendingSpinner className="ml-1.5" />
    </Link>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details open className="border border-[var(--color-accent)]/20 rounded-lg mb-3 px-3 py-2">
      <summary className="flex items-center justify-between cursor-pointer text-xs font-semibold uppercase tracking-widest text-[var(--color-footer)] py-1">
        {title}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-2.5 h-2.5 fill-current">
          <path d="M201.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 306.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z" />
        </svg>
      </summary>
      <div className="mt-2 flex flex-col gap-0.5">{children}</div>
    </details>
  );
}

export default function FilterSidebar({
  metals,
  categories,
  selectedMetal,
  selectedCategory,
}: {
  metals: string[];
  categories: string[];
  selectedMetal?: string;
  selectedCategory?: string;
}) {
  return (
    <aside className="sm:w-56 sm:shrink-0">
      {metals.length > 0 && (
        <FilterSection title="Metal">
          <FilterLink href={buildHref(undefined, selectedCategory)} active={!selectedMetal}>
            All Metals
          </FilterLink>
          {metals.map((metal) => (
            <FilterLink key={metal} href={buildHref(metal, selectedCategory)} active={selectedMetal === metal}>
              {metal}
            </FilterLink>
          ))}
        </FilterSection>
      )}

      <FilterSection title="Category">
        <FilterLink href={buildHref(selectedMetal, undefined)} active={!selectedCategory}>
          All Categories
        </FilterLink>
        {categories.map((cat) => (
          <FilterLink key={cat} href={buildHref(selectedMetal, cat)} active={selectedCategory === cat}>
            {cat}
          </FilterLink>
        ))}
      </FilterSection>
    </aside>
  );
}
