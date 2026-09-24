import Link from "next/link";
import LinkPendingSpinner from "./LinkPendingSpinner";
import { buildCatalogHref, type CatalogStatus } from "@/lib/catalogUrl";

const TABS: { status: CatalogStatus; label: string }[] = [
  { status: "in-stock", label: "In Stock" },
  { status: "sold", label: "Sold Out" },
];

export default function StatusTabs({
  status,
  counts,
  metal,
  category,
}: {
  status: CatalogStatus;
  counts: Record<CatalogStatus, number>;
  metal?: string;
  category?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Availability"
      className="inline-flex w-full sm:w-auto rounded-full bg-[var(--color-tint)] p-1 border border-[var(--color-accent)]/15"
    >
      {TABS.map((tab) => {
        const active = tab.status === status;
        return (
          <Link
            key={tab.status}
            href={buildCatalogHref({ status: tab.status, metal, category })}
            role="tab"
            aria-selected={active}
            className={`flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-full px-5 h-10 text-sm font-medium transition-colors ${
              active
                ? "bg-[var(--color-accent)] text-white shadow-sm"
                : "text-[var(--foreground)]/70 hover:text-[var(--color-accent-dark)]"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-2 text-xs leading-5 ${
                active ? "bg-white/25" : "bg-[var(--color-accent)]/10"
              }`}
            >
              {counts[tab.status].toLocaleString()}
            </span>
            <LinkPendingSpinner size={12} variant={active ? "white" : "accent"} />
          </Link>
        );
      })}
    </div>
  );
}
