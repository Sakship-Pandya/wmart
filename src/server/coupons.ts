import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { couponDiscount, couponProblem, couponSummary, normalizeCouponCode } from "@/lib/coupons";

// The coupon a shopper applied is remembered in a cookie (just the code). It is checked
// against the database every time the cart is shown and again when the order is placed,
// so editing the cookie can't give a discount the coupon doesn't allow.

const COOKIE = "wmart_coupon";

export async function readCouponCookie(): Promise<string> {
  return normalizeCouponCode((await cookies()).get(COOKIE)?.value ?? "");
}

/** Only call from a Server Action or Route Handler. Empty code removes the coupon. */
export async function writeCouponCookie(code: string) {
  const store = await cookies();
  if (!code) {
    store.delete(COOKIE);
    return;
  }
  store.set(COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function findCoupon(code: string) {
  if (!code) return null;
  return db.coupon.findUnique({ where: { code } });
}

export type AppliedCoupon =
  | { code: string; ok: true; discount: number; summary: string }
  | { code: string; ok: false; problem: string };

/** The cart's applied coupon (if any) checked against this subtotal. */
export async function getAppliedCoupon(subtotal: number): Promise<AppliedCoupon | null> {
  const code = await readCouponCookie();
  if (!code) return null;
  const coupon = await findCoupon(code);
  if (!coupon) return { code, ok: false, problem: `The code ${code} doesn't exist.` };
  const problem = couponProblem(coupon, subtotal);
  if (problem) return { code, ok: false, problem };
  return { code, ok: true, discount: couponDiscount(coupon, subtotal), summary: couponSummary(coupon) };
}
