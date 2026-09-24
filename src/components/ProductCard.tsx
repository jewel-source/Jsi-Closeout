import Image from "next/image";
import Link from "next/link";
import LinkPendingSpinner from "./LinkPendingSpinner";
import type { JewelryItem } from "@/lib/types";
import { formatPrice } from "@/lib/format";

export default function ProductCard({ item }: { item: JewelryItem }) {
  const photo = item.photos[0];
  const price = formatPrice(item.price);
  const showQty = !item.soldOut && item.quantityAvailable !== undefined;

  return (
    <Link
      href={`/jewelry/${item.id}`}
      className="group block text-center rounded-2xl border border-[var(--color-accent)]/10 bg-white p-2 pb-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_-12px_rgb(10_131_143/0.35)] hover:border-[var(--color-accent)]/30"
    >
      <div className="relative aspect-square bg-[var(--color-tint)] rounded-xl overflow-hidden">
        {photo ? (
          <Image
            src={photo.url}
            alt={photo.alt ?? item.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--foreground)]/30 text-sm">
            No photo
          </div>
        )}
        <LinkPendingSpinner
          size={22}
          className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow"
        />
        <div className="absolute inset-0 flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity [@media(hover:none)]:hidden">
          <span className="flex items-center gap-1.5 bg-[var(--color-accent)] text-white text-xs font-medium px-4 py-1.5 rounded-full">
            View
            <LinkPendingSpinner size={11} variant="white" />
          </span>
        </div>
      </div>
      <div className="pt-3 px-2">
        <p className="text-[11px] uppercase tracking-widest text-[var(--color-accent-dark)] font-medium">
          {item.category}
        </p>
        <p className="text-sm text-[var(--foreground)]/75 mt-0.5 leading-snug line-clamp-2">
          {item.description}
        </p>
        {(item.gtw || item.ctw) && (
          <p className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5 text-xs">
            {item.gtw && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-emerald-800">
                <span className="font-semibold">GTW</span> {item.gtw}
              </span>
            )}
            {item.ctw && (
              <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-sky-800">
                <span className="font-semibold">CTW</span> {item.ctw}
              </span>
            )}
          </p>
        )}
        {(price || showQty) && (
          <p className="mt-2 flex items-center justify-center gap-2 text-sm">
            {price && (
              <span className="font-semibold text-[var(--color-footer)]">{price}</span>
            )}
            {price && showQty && <span className="text-[var(--foreground)]/25">·</span>}
            {showQty && (
              <span className="text-[var(--foreground)]/60">
                Qty {item.quantityAvailable?.toLocaleString()}
              </span>
            )}
          </p>
        )}
      </div>
    </Link>
  );
}
