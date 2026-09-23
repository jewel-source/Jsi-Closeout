"use client";
import { useQuoteCart } from "@/context/QuoteCartContext";
export default function QuoteCartList() {
  const { items, removeItem, setQuantity } = useQuoteCart();
  if (items.length === 0) {
    return (
      <p className="text-[var(--foreground)]/60">
        You haven&apos;t added any pieces yet. Browse the catalog and click
        &quot;Add to quote request&quot; on items you&apos;re interested in.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-[var(--color-accent)]/15 border border-[var(--color-accent)]/20 rounded-2xl">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
          <div>
            <p className="text-xs text-[var(--color-accent-dark)] uppercase tracking-widest font-medium">
              {item.styleNumber}
            </p>
            <p className="font-medium">{item.name}</p>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <label className="text-sm text-[var(--foreground)]/60" htmlFor={`qty-${item.id}`}>
              Qty
            </label>
            <input
              id={`qty-${item.id}`}
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => setQuantity(item.id, Number(e.target.value))}
              className="w-20 h-10 border border-[var(--color-accent)]/30 rounded-md px-2"
            />
            <button
              onClick={() => removeItem(item.id)}
              className="text-sm text-red-600 hover:underline h-10 px-2"
            >
              Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
