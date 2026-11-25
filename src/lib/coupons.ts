// Coupon rules and discount maths, shared by the cart, checkout and order placement,
// so all three always agree. Pure functions: no database, safe anywhere.
// Money in paise. PERCENT coupons store a whole percent; FLAT coupons store paise.
import { formatPrice } from "@/lib/format";

export interface CouponRules {
  code: string;
  type: "PERCENT" | "FLAT";
  value: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
  startsAt: Date | null;
  expiresAt: Date | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
}

/** "WELCOME10" style: trimmed, upper-case, letters/numbers/-/_ only. Returns "" for anything else. */
export function normalizeCouponCode(input: string): string {
  const code = input.trim().toUpperCase();
  return /^[A-Z0-9_-]{3,30}$/.test(code) ? code : "";
}

/**
 * Why this coupon can't be used on a cart with this subtotal, or null if it can.
 * (Per-customer limits need the customer's email and are checked at checkout.)
 */
export function couponProblem(c: CouponRules, subtotal: number, now = new Date()): string | null {
  if (!c.isActive) return `The code ${c.code} is no longer active.`;
  if (c.startsAt && c.startsAt > now) return `The code ${c.code} isn't active yet.`;
  if (c.expiresAt && c.expiresAt < now) return `The code ${c.code} has expired.`;
  if (c.usageLimit !== null && c.usedCount >= c.usageLimit) return `The code ${c.code} has been fully used.`;
  if (c.minOrderValue && subtotal < c.minOrderValue) {
    return `Add ${formatPrice(c.minOrderValue - subtotal)} more to use ${c.code} (minimum order ${formatPrice(c.minOrderValue)}).`;
  }
  return null;
}

/** Discount in paise for this subtotal: percent (capped by maxDiscount) or flat, never more than the subtotal. */
export function couponDiscount(c: Pick<CouponRules, "type" | "value" | "maxDiscount">, subtotal: number): number {
  let discount = c.type === "PERCENT" ? Math.round((subtotal * c.value) / 100) : c.value;
  if (c.maxDiscount !== null && c.maxDiscount > 0) discount = Math.min(discount, c.maxDiscount);
  return Math.max(0, Math.min(discount, subtotal));
}

/** "10% off (up to ₹500)" / "₹200 off" – shown next to an applied coupon. */
export function couponSummary(c: Pick<CouponRules, "type" | "value" | "maxDiscount">): string {
  if (c.type === "FLAT") return `${formatPrice(c.value)} off`;
  return `${c.value}% off${c.maxDiscount ? ` (up to ${formatPrice(c.maxDiscount)})` : ""}`;
}
