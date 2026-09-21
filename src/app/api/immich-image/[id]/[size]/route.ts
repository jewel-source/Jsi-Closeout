export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      size: string;
    }>;
  },
) {
  const { id, size: rawSize } = await params;
  const size = rawSize === "thumbnail" ? "thumbnail" : "preview";
  const baseUrl = process.env.IMMICH_BASE_URL;
  const apiKey = process.env.IMMICH_API_KEY;
  if (!baseUrl || !apiKey) {
    return new Response("Immich not configured", { status: 500 });
  }
  const upstream = await fetch(
    `${baseUrl.replace(/\/$/, "")}/assets/${id}/thumbnail?size=${size}`,
    {
      headers: { "x-api-key": apiKey },
    },
  );
  if (!upstream.ok || !upstream.body) {
    return new Response("Image not found", { status: upstream.status || 404 });
  }
  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
