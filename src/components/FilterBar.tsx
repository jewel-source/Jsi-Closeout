"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LinkPendingSpinner from "./LinkPendingSpinner";
import { QTY_RANGES, buildCatalogHref, type CatalogStatus } from "@/lib/catalogUrl";

type FilterKey = "metal" | "category" | "qty" | "sort";
type Option = { value: string; label: string };

const toOptions = (values: string[]): Option[] => values.map((v) => ({ value: v, label: v }));
const QTY_OPTIONS: Option[] = QTY_RANGES.map(({ value, label }) => ({ value, label }));
const SORT_OPTIONS: Option[] = [{ value: "qty-desc", label: "Highest first" }];

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function Check() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function FilterDropdown({
  label,
  allLabel,
  options,
  selected,
  open,
  onToggle,
  onClose,
  hrefFor,
}: {
  label: string;
  allLabel: string;
  options: Option[];
  selected: string | undefined;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  hrefFor: (value: string | undefined) => string;
}) {
  const active = Boolean(selected);
  const selectedLabel = options.find((o) => o.value === selected)?.label ?? selected;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex h-11 items-center gap-2 rounded-full border pl-4 pr-3 text-sm transition-colors ${
          active
            ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
            : "border-[var(--color-accent)]/25 bg-white text-[var(--foreground)]/80 hover:border-[var(--color-accent)]/60"
        }`}
      >
        <span className={active ? "text-white/75" : "text-[var(--foreground)]/50"}>{label}</span>
        <span className="font-medium max-w-[9rem] truncate">{selectedLabel ?? allLabel}</span>
        <Chevron open={open} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 sm:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          <div
            role="listbox"
            aria-label={label}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-y-auto rounded-t-3xl border-t border-[var(--color-accent)]/15 bg-white px-3 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-full sm:mt-2 sm:max-h-80 sm:w-64 sm:rounded-2xl sm:border sm:p-2 sm:shadow-[0_16px_40px_-12px_rgb(10_131_143/0.35)]"
          >
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[var(--foreground)]/15 sm:hidden" />
            <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-footer)] sm:hidden">
              {label}
            </p>
            {[undefined, ...options].map((option) => {
              const isSelected = option?.value === selected;
              return (
                <Link
                  key={option?.value ?? "all"}
                  href={hrefFor(option?.value)}
                  role="option"
                  aria-selected={isSelected}
                  onClick={onClose}
                  className={`flex min-h-11 items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[15px] sm:text-sm ${
                    isSelected
                      ? "bg-[var(--color-tint)] font-medium text-[var(--color-accent-dark)]"
                      : "text-[var(--foreground)]/80 hover:bg-[var(--color-tint)]"
                  }`}
                >
                  <span>{option?.label ?? allLabel}</span>
                  <span className="flex items-center gap-2">
                    <LinkPendingSpinner size={12} />
                    {isSelected && <Check />}
                  </span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function FilterBar({
  metals,
  categories,
  selectedMetal,
  selectedCategory,
  selectedQty,
  selectedSort,
  status,
}: {
  metals: string[];
  categories: string[];
  selectedMetal?: string;
  selectedCategory?: string;
  selectedQty?: string;
  selectedSort?: string;
  status: CatalogStatus;
}) {
  const [openKey, setOpenKey] = useState<FilterKey | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openKey) return;
    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpenKey(null);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenKey(null);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openKey]);

  const toggle = (key: FilterKey) => setOpenKey((current) => (current === key ? null : key));
  const hasFilters = Boolean(selectedMetal || selectedCategory || selectedQty);
  const current = {
    status,
    metal: selectedMetal,
    category: selectedCategory,
    qty: selectedQty,
    sort: selectedSort,
  };

  return (
    <div ref={containerRef} className="flex flex-wrap items-center gap-2 sm:gap-3">
      <span className="hidden sm:inline text-xs font-semibold uppercase tracking-widest text-[var(--color-footer)] mr-1">
        Filter
      </span>

      {metals.length > 0 && (
        <FilterDropdown
          label="Metal"
          allLabel="All"
          options={toOptions(metals)}
          selected={selectedMetal}
          open={openKey === "metal"}
          onToggle={() => toggle("metal")}
          onClose={() => setOpenKey(null)}
          hrefFor={(value) => buildCatalogHref({ ...current, metal: value })}
        />
      )}

      <FilterDropdown
        label="Category"
        allLabel="All"
        options={toOptions(categories)}
        selected={selectedCategory}
        open={openKey === "category"}
        onToggle={() => toggle("category")}
        onClose={() => setOpenKey(null)}
        hrefFor={(value) => buildCatalogHref({ ...current, category: value })}
      />

      {status === "in-stock" && (
        <>
          <FilterDropdown
            label="Qty"
            allLabel="Any"
            options={QTY_OPTIONS}
            selected={selectedQty}
            open={openKey === "qty"}
            onToggle={() => toggle("qty")}
            onClose={() => setOpenKey(null)}
            hrefFor={(value) => buildCatalogHref({ ...current, qty: value })}
          />
          <FilterDropdown
            label="Sort"
            allLabel="Lowest qty first"
            options={SORT_OPTIONS}
            selected={selectedSort === "qty-desc" ? "qty-desc" : undefined}
            open={openKey === "sort"}
            onToggle={() => toggle("sort")}
            onClose={() => setOpenKey(null)}
            hrefFor={(value) => buildCatalogHref({ ...current, sort: value })}
          />
        </>
      )}

      {hasFilters && (
        <Link
          href={buildCatalogHref({ status, sort: selectedSort })}
          className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-[var(--color-accent-dark)] hover:bg-[var(--color-tint)]"
        >
          Clear all
          <LinkPendingSpinner size={12} />
        </Link>
      )}
    </div>
  );
}
