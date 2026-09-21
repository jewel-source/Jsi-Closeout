"use client";
import Link from "next/link";
import { useQuoteCart } from "@/context/QuoteCartContext";
export default function Header() {
  const { items } = useQuoteCart();
  return (
    <header className="border-b border-black/10 sticky top-0 bg-white/90 backdrop-blur z-10">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-wide">
          Jewel Source
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/" className="hover:underline">
            Catalog
          </Link>
          <Link href="/quote" className="hover:underline">
            Quote Request{items.length > 0 ? ` (${items.length})` : ""}
          </Link>
        </nav>
      </div>
    </header>
  );
}
