import { quickSearch } from "@/server/queries/products";

// Live search suggestions for the header search box: GET /api/search?q=hs04
export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").slice(0, 80);
  const results = await quickSearch(q, 6);
  return Response.json(
    results.map((p) => ({
      slug: p.slug,
      title: p.title,
      brand: p.brand.name,
      price: p.price,
      image: p.images[0]?.url ?? null,
    })),
  );
}
