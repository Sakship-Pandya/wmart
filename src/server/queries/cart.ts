import "server-only";
import { db } from "@/lib/db";
import { readCartCookie } from "@/lib/cart-cookie";

// Reads the cart cookie and fills in current product details and prices from the database.
// Products that were deleted or hidden are dropped; quantities are capped at the stock left.

export type CartLine = {
  productId: string;
  slug: string;
  title: string;
  brand: string;
  image: { url: string; alt: string | null } | null;
  price: number; // paise, GST included
  mrp: number;
  stock: number;
  quantity: number;
  lineTotal: number;
};

export type Cart = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number; // paise, GST included
  mrpTotal: number;
  savings: number;
  shipping: number; // free shipping on all orders
  total: number;
};

export async function getCart(): Promise<Cart> {
  const cookieLines = await readCartCookie();
  const products = cookieLines.length
    ? await db.product.findMany({
        where: { id: { in: cookieLines.map((l) => l.p) }, isActive: true },
        select: {
          id: true,
          slug: true,
          title: true,
          price: true,
          mrp: true,
          stock: true,
          brand: { select: { name: true } },
          images: { select: { url: true, alt: true }, orderBy: { position: "asc" }, take: 1 },
        },
      })
    : [];
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines: CartLine[] = [];
  for (const l of cookieLines) {
    const p = byId.get(l.p);
    if (!p || p.stock <= 0) continue;
    const quantity = Math.min(l.q, p.stock);
    lines.push({
      productId: p.id,
      slug: p.slug,
      title: p.title,
      brand: p.brand.name,
      image: p.images[0] ?? null,
      price: p.price,
      mrp: p.mrp,
      stock: p.stock,
      quantity,
      lineTotal: p.price * quantity,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const mrpTotal = lines.reduce((s, l) => s + Math.max(l.mrp, l.price) * l.quantity, 0);
  return {
    lines,
    itemCount: lines.reduce((s, l) => s + l.quantity, 0),
    subtotal,
    mrpTotal,
    savings: mrpTotal - subtotal,
    shipping: 0,
    total: subtotal,
  };
}

/** Number of items for the header badge – reads only the cookie, no database call. */
export async function getCartCount(): Promise<number> {
  return (await readCartCookie()).reduce((s, l) => s + l.q, 0);
}
