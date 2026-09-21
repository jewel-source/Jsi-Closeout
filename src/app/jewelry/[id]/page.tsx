import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog, getItem } from "@/lib/catalog";
import AddToQuoteButton from "@/components/AddToQuoteButton";
import type { JewelryItem } from "@/lib/types";
export function generateStaticParams() {
  return getCatalog().map((item) => ({ id: item.id }));
}
function getDetailFields(item: JewelryItem): {
  key: string;
  label: string;
  value: string;
}[] {
  const isDiamond =
    /diamond/i.test(item.stone ?? "") || /diamond/i.test(item.category);
  const weightLabel = isDiamond
    ? "Total Carat Weight (CTW)"
    : "Total Gem Weight (GTW)";
  return [
    { key: "metal", label: "Metal", value: item.metal },
    { key: "stone", label: "Stone", value: item.stone },
    { key: "size", label: "Size", value: item.size },
    { key: "caratWeight", label: weightLabel, value: item.caratWeight },
    { key: "collection", label: "Collection", value: item.collection },
  ].filter(
    (
      f,
    ): f is {
      key: string;
      label: string;
      value: string;
    } => Boolean(f.value),
  );
}
export default async function JewelryDetail({
  params,
}: PageProps<"/jewelry/[id]">) {
  const { id } = await params;
  const item = getItem(id);
  if (!item) notFound();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/" className="text-sm text-black/60 hover:underline">
        &larr; Back to catalog
      </Link>

      <div className="mt-6 grid md:grid-cols-2 gap-10">
        <div className="grid grid-cols-2 gap-3">
          {item.photos.length > 0 ? (
            item.photos.map((photo, i) => (
              <div
                key={photo.url}
                className={`relative aspect-square bg-neutral-100 rounded-lg overflow-hidden ${i === 0 ? "col-span-2" : ""}`}
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
            <div className="col-span-2 aspect-square bg-neutral-100 rounded-lg flex items-center justify-center text-black/30">
              No photo available
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-black/50 uppercase tracking-wide">
            {item.styleNumber}
          </p>
          <h1 className="text-2xl font-semibold mt-1">{item.name}</h1>
          <p className="text-black/60 mt-1">{item.category}</p>

          <p className="mt-6 text-black/80 leading-relaxed">
            {item.description}
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-y-3 text-sm">
            {getDetailFields(item).map((f) => (
              <div key={f.key}>
                <dt className="text-black/50">{f.label}</dt>
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
