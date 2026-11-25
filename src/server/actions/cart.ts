"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { MAX_QTY, readCartCookie, writeCartCookie } from "@/lib/cart-cookie";
import { couponDiscount, couponProblem, normalizeCouponCode } from "@/lib/coupons";
import { formatPrice } from "@/lib/format";
import { getCurrentCustomer } from "@/lib/customer-session";
import { findCoupon, writeCouponCookie } from "@/server/coupons";
import { countCouponUses } from "@/server/orders/place-order";
import { getCart } from "@/server/queries/cart";

// Cart actions. Changing the cookie in a Server Action makes Next.js re-render the page,
// so the cart page and the header count update by themselves.

export type CartActionState = { status: "idle" | "success" | "error"; message?: string; at?: number };

const input = z.object({
  productId: z.string().min(1).max(40),
  quantity: z.coerce.number().int().min(0).max(MAX_QTY),
});

async function findBuyable(productId: string) {
  return db.product.findFirst({
    where: { id: productId, isActive: true },
    select: { id: true, stock: true, title: true },
  });
}

/** Adds to the quantity already in the cart (used by Add To Cart / Buy Now). */
async function add(productId: string, quantity: number): Promise<CartActionState> {
  const product = await findBuyable(productId);
  if (!product) return { status: "error", message: "This product is no longer available." };
  if (product.stock <= 0) return { status: "error", message: "Sorry, this product is out of stock." };

  const lines = await readCartCookie();
  const existing = lines.find((l) => l.p === productId);
  const wanted = (existing?.q ?? 0) + Math.max(1, quantity);
  const q = Math.min(wanted, product.stock, MAX_QTY);
  if (existing) existing.q = q;
  else lines.push({ p: productId, q });
  await writeCartCookie(lines);

  return q < wanted
    ? { status: "success", message: `Only ${product.stock} in stock – your cart now has ${q}.`, at: Date.now() }
    : { status: "success", message: "Added to cart.", at: Date.now() };
}

export async function addToCart(_prev: CartActionState, formData: FormData): Promise<CartActionState> {
  const parsed = input.safeParse({ productId: formData.get("productId"), quantity: formData.get("quantity") ?? 1 });
  if (!parsed.success) return { status: "error", message: "Please choose a valid quantity." };
  return add(parsed.data.productId, parsed.data.quantity);
}

export async function buyNow(_prev: CartActionState, formData: FormData): Promise<CartActionState> {
  const parsed = input.safeParse({ productId: formData.get("productId"), quantity: formData.get("quantity") ?? 1 });
  if (!parsed.success) return { status: "error", message: "Please choose a valid quantity." };
  const result = await add(parsed.data.productId, parsed.data.quantity);
  if (result.status === "error") return result;
  redirect("/checkout");
}

/** Sets the exact quantity of a cart line (0 removes it). */
export async function updateCartItem(formData: FormData): Promise<void> {
  const parsed = input.safeParse({ productId: formData.get("productId"), quantity: formData.get("quantity") });
  if (!parsed.success) return;
  const { productId, quantity } = parsed.data;
  let lines = await readCartCookie();
  if (quantity === 0) {
    lines = lines.filter((l) => l.p !== productId);
  } else {
    const product = await findBuyable(productId);
    const line = lines.find((l) => l.p === productId);
    if (!product || !line) return;
    line.q = Math.min(quantity, product.stock, MAX_QTY);
  }
  await writeCartCookie(lines);
}

export async function removeCartItem(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") ?? "");
  await writeCartCookie((await readCartCookie()).filter((l) => l.p !== productId));
}

export async function applyCoupon(_prev: CartActionState, formData: FormData): Promise<CartActionState> {
  const raw = String(formData.get("coupon") ?? "").trim();
  if (!raw) return { status: "error", message: "Enter a coupon code." };
  const code = normalizeCouponCode(raw);
  // Same message for a badly typed and an unknown code.
  const coupon = code ? await findCoupon(code) : null;
  if (!coupon) return { status: "error", message: `The code ${raw.toUpperCase()} doesn't exist.`, at: Date.now() };

  const cart = await getCart();
  if (cart.lines.length === 0) return { status: "error", message: "Add a product to your cart first.", at: Date.now() };
  const problem = couponProblem(coupon, cart.subtotal);
  if (problem) return { status: "error", message: problem, at: Date.now() };

  // Signed-in customers: check "uses per customer" now (guests are checked at checkout, by email).
  const customer = await getCurrentCustomer();
  if (customer && coupon.perCustomerLimit !== null) {
    const used = await countCouponUses(coupon.id, customer.email);
    if (used >= coupon.perCustomerLimit) {
      return { status: "error", message: `You've already used ${coupon.code}.`, at: Date.now() };
    }
  }

  await writeCouponCookie(coupon.code);
  return {
    status: "success",
    message: `${coupon.code} applied – you save ${formatPrice(couponDiscount(coupon, cart.subtotal))}.`,
    at: Date.now(),
  };
}

export async function removeCoupon(): Promise<void> {
  await writeCouponCookie("");
}
