import Image from "next/image";
import { notFound } from "next/navigation";
import { getCatalog, getItem } from "@/lib/catalog";
import AddToQuoteButton from "@/components/AddToQuoteButton";
import BackToCatalogLink from "@/components/BackToCatalogLink";
import type { JewelryItem } from "@/lib/types";

export function generateStaticParams() {
  return getCatalog().map((item) => ({ id: item.id }));
}

function getDetailFields(item: JewelryItem): {
  key: string;
  label: string;
  value: string;
}[] {
  return [
    { key: "metal", label: "Metal", value: item.metal },
    { key: "stone", label: "Stone", value: item.stone },
    { key: "size", label: "Size", value: item.size },
    { key: "gtw", label: "Total Gem Weight (GTW)", value: item.gtw },
    { key: "ctw", label: "Total Carat Weight (CTW)", value: item.ctw },
    { key: "collection", label: "Collection", value: item.collection },
  ].filter((f): f is { key: string; label: string; value: string } => Boolean(f.value));
}

export default async function JewelryDetail({ params }: PageProps<"/jewelry/[id]">) {
  const { id } = await params;
  const item = getItem(id);
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <BackToCatalogLink />

      <div className="mt-6 grid md:grid-cols-2 gap-10">
        <div className="grid grid-cols-2 gap-3">
          {item.photos.length > 0 ? (
            item.photos.map((photo, i) => (
              <div
                key={photo.url}
                className={`relative aspect-square bg-[var(--color-tint)] rounded-2xl overflow-hidden ${i === 0 ? "col-span-2" : ""}`}
              >
                <Image
                  src={photo.url}
                  alt={photo.alt ?? item.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority={i === 0}
                />
              </div>
            ))
          ) : (
            <div className="col-span-2 aspect-square bg-[var(--color-tint)] rounded-2xl flex items-center justify-center text-[var(--foreground)]/30">
              No photo available
            </div>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--color-accent-dark)] font-medium">
            {item.category}
          </p>
          <h1 className="font-serif text-3xl font-bold mt-1 text-[var(--color-footer)]">
            {item.name}
          </h1>
          <p className="text-[var(--foreground)]/50 text-sm mt-1">{item.styleNumber}</p>

          <p className="mt-6 text-[var(--foreground)]/80 leading-relaxed">{item.description}</p>

          <dl className="mt-6 grid grid-cols-2 gap-y-3 text-sm border-t border-[var(--color-accent)]/15 pt-6">
            {getDetailFields(item).map((f) => (
              <div key={f.key}>
                <dt className="text-[var(--foreground)]/50">{f.label}</dt>
                <dd className="font-medium">{f.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8">
            <AddToQuoteButton item={item} />
          </div>
        </div>
      </div>
    </div>
  );
}
