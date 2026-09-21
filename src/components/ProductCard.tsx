import Image from "next/image";
import Link from "next/link";
import type { JewelryItem } from "@/lib/types";

export default function ProductCard({ item }: { item: JewelryItem }) {
  const photo = item.photos[0];
  return (
    <Link href={`/jewelry/${item.id}`} className="group block text-center">
      <div className="relative aspect-square bg-sky-50 rounded-lg overflow-hidden">
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
        <div className="absolute inset-0 flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="bg-[var(--color-accent)] text-white text-xs font-medium px-4 py-1.5 rounded-full">
            View
          </span>
        </div>
      </div>
      <div className="pt-3">
        <p className="text-[11px] uppercase tracking-widest text-[var(--color-accent-dark)] font-medium">
          {item.category}
        </p>
        <h3 className="font-serif text-base mt-0.5 leading-snug">{item.name}</h3>
      </div>
    </Link>
  );
}
