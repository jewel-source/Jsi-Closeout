"use client";
import { useQuoteCart } from "@/context/QuoteCartContext";
export default function QuoteCartList() {
  const { items, removeItem, setQuantity } = useQuoteCart();
  if (items.length === 0) {
    return (
      <p className="text-black/60">
        You haven&apos;t added any pieces yet. Browse the catalog and click
        &quot;Add to quote request&quot; on items you&apos;re interested in.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-black/10 border border-black/10 rounded-lg">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-4 p-4"
        >
          <div>
            <p className="text-xs text-black/50 uppercase tracking-wide">
              {item.styleNumber}
            </p>
            <p className="font-medium">{item.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-black/60" htmlFor={`qty-${item.id}`}>
              Qty
            </label>
            <input
              id={`qty-${item.id}`}
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => setQuantity(item.id, Number(e.target.value))}
              className="w-16 border border-black/20 rounded-md px-2 py-1"
            />
            <button
              onClick={() => removeItem(item.id)}
              className="text-sm text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
