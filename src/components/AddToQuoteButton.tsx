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
          ? "bg-black/10 text-black/50 cursor-default"
          : "bg-black text-white hover:bg-black/80"
      }`}
    >
      {added ? "Added to quote request" : "Add to quote request"}
    </button>
  );
}
