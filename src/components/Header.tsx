"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuoteCart } from "@/context/QuoteCartContext";

export default function Header() {
  const { items } = useQuoteCart();
  const [panelOpen, setPanelOpen] = useState(false);

  const navLinks = (
    <>
      <Link href="/" className="hover:text-[var(--color-accent)] transition-colors" onClick={() => setPanelOpen(false)}>
        Catalog
      </Link>
      <Link
        href="/quote"
        className="inline-flex items-center gap-2 sm:rounded-full sm:bg-[var(--color-accent)] sm:text-white sm:px-4 sm:py-1.5 sm:hover:bg-[var(--color-accent-dark)] transition-colors"
        onClick={() => setPanelOpen(false)}
      >
        Quote Request
        {items.length > 0 && (
          <span className="rounded-full bg-white/25 sm:bg-white/25 px-1.5 text-xs leading-5">
            {items.length}
          </span>
        )}
      </Link>
    </>
  );

  return (
    <>
      <header className="sticky top-0 z-20 bg-[var(--color-header)]/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setPanelOpen(true)}
            className="sm:hidden p-1 -ml-1"
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <Link href="/" aria-label="Jewel Source home" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Jewel Source"
              width={1148}
              height={404}
              priority
              className="h-10 sm:h-11 w-auto"
            />
          </Link>

          <nav className="hidden sm:flex items-center gap-8 text-sm font-medium text-[var(--color-footer)]">
            {navLinks}
          </nav>

          <div className="sm:hidden w-8" />
        </div>
        <div className="brand-gradient h-[3px]" />
      </header>

      {panelOpen && (
        <div className="fixed inset-0 z-30 sm:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setPanelOpen(false)}
          />
          <nav className="absolute left-0 top-0 bottom-0 w-64 bg-[var(--color-footer)] text-white p-6 flex flex-col gap-1">
            <div className="flex justify-end mb-6">
              <button onClick={() => setPanelOpen(false)} aria-label="Close menu">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-4 text-sm font-medium">{navLinks}</div>
          </nav>
        </div>
      )}
    </>
  );
}
