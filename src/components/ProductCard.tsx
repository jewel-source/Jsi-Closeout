import Image from "next/image";
import Link from "next/link";
import type { JewelryItem } from "@/lib/types";
export default function ProductCard({ item }: { item: JewelryItem }) {
  const photo = item.photos[0];
  return (
    <Link
      href={`/jewelry/${item.id}`}
      className="group block rounded-lg overflow-hidden border border-black/10 hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-square bg-neutral-100">
        {photo ? (
          <Image
            src={photo.url}
            alt={photo.alt ?? item.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-black/30 text-sm">
            No photo
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs text-black/50 uppercase tracking-wide">
          {item.styleNumber}
        </p>
        <h3 className="font-medium leading-snug">{item.name}</h3>
        <p className="text-sm text-black/60">{item.category}</p>
      </div>
    </Link>
  );
}
