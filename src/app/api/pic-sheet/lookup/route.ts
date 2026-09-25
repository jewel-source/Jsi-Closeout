import { getCatalog } from "@/lib/catalog";
import type { PicSheetLookupItem } from "@/lib/picSheet";

const MAX_IDS = 500;

export async function POST(request: Request) {
  let ids: unknown;
  try {
    ({ ids } = await request.json());
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!Array.isArray(ids) || ids.length > MAX_IDS) {
    return Response.json(
      { error: `Send up to ${MAX_IDS} item ids.` },
      { status: 400 },
    );
  }
  const wanted = new Set(ids.map((id) => String(id)));
  const items: PicSheetLookupItem[] = [];
  for (const item of getCatalog()) {
    if (!wanted.has(item.id)) continue;
    items.push({
      id: item.id,
      styleNumber: item.styleNumber,
      description: item.description,
      metal: item.metal,
      ctw: item.ctw,
      gtw: item.gtw,
      price: item.price,
      soldOut: Boolean(item.soldOut),
      photoUrl: item.photos[0]?.url,
    });
  }
  return Response.json({ items });
}
