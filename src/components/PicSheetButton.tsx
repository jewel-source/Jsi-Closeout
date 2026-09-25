"use client";
import { useState } from "react";
import { useQuoteCart } from "@/context/QuoteCartContext";
import Spinner from "./Spinner";
import {
  downloadPicSheet,
  type PicSheetLookupItem,
  type PicSheetRow,
} from "@/lib/picSheet";

export default function PicSheetButton() {
  const { items } = useQuoteCart();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) return null;

  async function download() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setProgress(null);
    try {
      const res = await fetch("/api/pic-sheet/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: items.map((i) => i.id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load item details");
      const byId = new Map(
        (data.items as PicSheetLookupItem[]).map((i) => [i.id, i]),
      );
      const rows: PicSheetRow[] = items.flatMap((cartItem) => {
        const info = byId.get(cartItem.id);
        return info ? [{ ...info, quantity: cartItem.quantity }] : [];
      });
      if (rows.length === 0) {
        throw new Error("None of these pieces are in the catalog anymore.");
      }
      await downloadPicSheet(rows, (done, total) =>
        setProgress({ done, total }),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not build the sheet",
      );
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="mt-4">
      <button
        onClick={download}
        disabled={busy}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-[var(--color-accent)] text-[var(--color-accent-dark)] font-medium hover:bg-[var(--color-tint)] disabled:opacity-60"
      >
        {busy && <Spinner size={16} />}
        {busy
          ? progress && progress.total > 0
            ? `Adding photos ${progress.done}/${progress.total}...`
            : "Building..."
          : "Download picture sheet (Excel)"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
