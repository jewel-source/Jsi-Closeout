import Link from "next/link";
import LinkPendingSpinner from "./LinkPendingSpinner";

function buildHref(
  page: number,
  metal: string | undefined,
  category: string | undefined,
) {
  const params = new URLSearchParams();
  if (metal) params.set("metal", metal);
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

function pageWindow(current: number, total: number): (number | "gap")[] {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("gap");
    result.push(p);
  });
  return result;
}

const baseClass =
  "inline-flex items-center justify-center gap-1.5 min-w-9 h-9 px-3 rounded-full text-sm font-medium transition-colors";

export default function Pagination({
  page,
  totalPages,
  metal,
  category,
}: {
  page: number;
  totalPages: number;
  metal?: string;
  category?: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link
          href={buildHref(page - 1, metal, category)}
          className={`${baseClass} text-[var(--color-accent-dark)] hover:bg-[var(--color-tint)]`}
        >
          Previous
        </Link>
      ) : (
        <span className={`${baseClass} text-[var(--foreground)]/30`}>Previous</span>
      )}

      {pageWindow(page, totalPages).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-[var(--foreground)]/40">
            …
          </span>
        ) : p === page ? (
          <span
            key={p}
            aria-current="page"
            className={`${baseClass} bg-[var(--color-accent)] text-white`}
          >
            {p}
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(p, metal, category)}
            className={`${baseClass} text-[var(--foreground)]/75 hover:bg-[var(--color-tint)]`}
          >
            {p}
            <LinkPendingSpinner size={10} />
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link
          href={buildHref(page + 1, metal, category)}
          className={`${baseClass} text-[var(--color-accent-dark)] hover:bg-[var(--color-tint)]`}
        >
          Next
        </Link>
      ) : (
        <span className={`${baseClass} text-[var(--foreground)]/30`}>Next</span>
      )}
    </nav>
  );
}
