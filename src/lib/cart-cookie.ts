import "server-only";
import { cookies } from "next/headers";
import { z } from "zod";

// The cart is kept in a cookie so guests can shop without an account.
// It only stores product ids and quantities – prices are always read fresh from the database.

const COOKIE = "wmart_cart";
export const MAX_QTY = 99;
const MAX_LINES = 50;

const cartSchema = z
  .array(z.object({ p: z.string().min(1).max(40), q: z.number().int().min(1).max(MAX_QTY) }))
  .max(MAX_LINES);

export type CartCookieLine = z.infer<typeof cartSchema>[number];

export async function readCartCookie(): Promise<CartCookieLine[]> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = cartSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

/** Only call from a Server Action or Route Handler. */
export async function writeCartCookie(lines: CartCookieLine[]) {
  const store = await cookies();
  const clean = lines.filter((l) => l.q > 0).slice(0, MAX_LINES);
  if (clean.length === 0) {
    store.delete(COOKIE);
    return;
  }
  store.set(COOKIE, JSON.stringify(clean), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}
