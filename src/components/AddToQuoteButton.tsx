"use client";
import { useQuoteCart } from "@/context/QuoteCartContext";
import type { JewelryItem } from "@/lib/types";
export default function AddToQuoteButton({ item }: { item: JewelryItem }) {
  const { addItem, isInCart } = useQuoteCart();
  const added = isInCart(item.id);
  return (
    <button
      onClick={() =>
        addItem({ id: item.id, styleNumber: item.styleNumber, name: item.name })
      }
      disabled={added}
      className={`w-full sm:w-auto px-6 py-3 rounded-md font-medium transition-colors ${
        added
          ? "bg-[var(--color-accent)]/10 text-[var(--color-accent-dark)] cursor-default"
          : "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-dark)]"
      }`}
    >
      {added ? "Added to quote request" : "Add to quote request"}
    </button>
  );
}
