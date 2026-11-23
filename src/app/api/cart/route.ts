import { getCart } from "@/server/queries/cart";

// Current cart for the header mini-cart panel: GET /api/cart (reads the visitor's cart cookie).
export async function GET() {
  const cart = await getCart();
  return Response.json(cart, { headers: { "Cache-Control": "no-store" } });
}
