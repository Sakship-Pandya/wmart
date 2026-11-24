// Shared order helpers for the admin panel (and later the store's account pages).
// Pure functions only: safe to import from server and client components.

import type {
  CouponType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShipmentStatus,
} from "@/generated/prisma/enums";
import { splitInclusivePrice } from "@/lib/gst";

/** Seller's state (registered GST address: Ahmedabad, Gujarat). Same state = CGST + SGST, otherwise IGST. */
export const SELLER_STATE = process.env.NEXT_PUBLIC_SELLER_STATE || "Gujarat";

export function isIntraState(buyerState: string): boolean {
  return buyerState.trim().toLowerCase() === SELLER_STATE.toLowerCase();
}

/** 10234 -> "WM10234" */
export function formatOrderNumber(orderNumber: number): string {
  return `WM${orderNumber}`;
}

/** "WM10234", "wm10234" or "10234" -> 10234; anything else -> null */
export function parseOrderNumber(input: string): number | null {
  const match = input.trim().match(/^(?:wm)?(\d{1,9})$/i);
  return match ? Number(match[1]) : null;
}

export type AddressSnapshot = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
};

export function asAddress(value: unknown): AddressSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const a = value as Record<string, unknown>;
  if (typeof a.fullName !== "string" || typeof a.line1 !== "string") return null;
  return {
    fullName: a.fullName,
    phone: String(a.phone ?? ""),
    line1: a.line1,
    line2: typeof a.line2 === "string" ? a.line2 : null,
    city: String(a.city ?? ""),
    state: String(a.state ?? ""),
    pincode: String(a.pincode ?? ""),
  };
}

// ─── Labels and badge colours ────────────────────────────────────────────────

type Tone = "neutral" | "info" | "warning" | "success" | "danger";

export const toneClass: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  // WMart theme colours (same as the store): blue = in progress, yellow = needs attention,
  // green = done, red = problem.
  info: "bg-primary/10 text-primary",
  warning: "bg-star/25 text-heading",
  success: "bg-success/10 text-success",
  danger: "bg-destructive/10 text-destructive",
};

export const orderStatusInfo: Record<OrderStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "Pending", tone: "warning" },
  CONFIRMED: { label: "Confirmed", tone: "info" },
  PACKED: { label: "Packed", tone: "info" },
  SHIPPED: { label: "Shipped", tone: "info" },
  DELIVERED: { label: "Delivered", tone: "success" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
  RETURNED: { label: "Returned", tone: "neutral" },
};

export const paymentStatusInfo: Record<PaymentStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "Unpaid", tone: "warning" },
  PAID: { label: "Paid", tone: "success" },
  FAILED: { label: "Failed", tone: "danger" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
  PARTIALLY_REFUNDED: { label: "Part refunded", tone: "neutral" },
};

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  PAYU: "PayU (online)",
  COD: "Cash on Delivery",
};

export const shipmentStatusLabel: Record<ShipmentStatus, string> = {
  PENDING: "Not booked",
  MANIFESTED: "Manifested",
  PICKED_UP: "Picked up",
  IN_TRANSIT: "In transit",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  RTO_IN_TRANSIT: "Returning (RTO)",
  RTO_DELIVERED: "Returned to us (RTO)",
  LOST: "Lost",
};

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const satisfies readonly OrderStatus[];

export const PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
] as const satisfies readonly PaymentStatus[];

export const SHIPMENT_STATUSES = [
  "PENDING",
  "MANIFESTED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "RTO_IN_TRANSIT",
  "RTO_DELIVERED",
  "LOST",
] as const satisfies readonly ShipmentStatus[];

/**
 * Status changes the admin may make from each status. Keeps orders moving forward
 * (no "Delivered" back to "Pending") while still allowing cancellation and returns.
 */
export const allowedNextStatuses: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PACKED", "SHIPPED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: [],
};

/** Statuses where the items are no longer going to the customer, so stock goes back. */
export const RESTOCK_STATUSES: OrderStatus[] = ["CANCELLED", "RETURNED"];

// ─── Coupons ─────────────────────────────────────────────────────────────────

export const couponTypeLabel: Record<CouponType, string> = {
  PERCENT: "Percentage discount",
  FLAT: "Fixed amount (₹)",
};

export type CouponState = "active" | "scheduled" | "expired" | "used-up" | "disabled";

export function couponState(
  c: { isActive: boolean; startsAt: Date | null; expiresAt: Date | null; usageLimit: number | null; usedCount: number },
  now = new Date(),
): CouponState {
  if (!c.isActive) return "disabled";
  if (c.expiresAt && c.expiresAt < now) return "expired";
  if (c.usageLimit !== null && c.usedCount >= c.usageLimit) return "used-up";
  if (c.startsAt && c.startsAt > now) return "scheduled";
  return "active";
}

export const couponStateInfo: Record<CouponState, { label: string; tone: Tone }> = {
  active: { label: "Active", tone: "success" },
  scheduled: { label: "Scheduled", tone: "info" },
  expired: { label: "Expired", tone: "neutral" },
  "used-up": { label: "Used up", tone: "neutral" },
  disabled: { label: "Disabled", tone: "danger" },
};

/** "10% off" / "₹200 off" text for a coupon. Value is percent or paise. */
export function couponValueText(type: CouponType, value: number): string {
  return type === "PERCENT" ? `${value}% off` : `₹${(value / 100).toLocaleString("en-IN")} off`;
}

// ─── Dates (stored UTC, shown IST) ───────────────────────────────────────────

const istDate = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const istDateTime = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateIST(d: Date | string): string {
  return istDate.format(new Date(d));
}

export function formatDateTimeIST(d: Date | string): string {
  return istDateTime.format(new Date(d));
}

// ─── GST on an order ─────────────────────────────────────────────────────────

/**
 * Splits what was actually charged for the items (subtotal minus coupon discount,
 * shared across lines by value) into taxable value + CGST/SGST or IGST.
 * Prices are GST-inclusive. Shipping and COD fees are not included.
 */
export function orderGstSplit(order: {
  subtotal: number;
  discount: number;
  intraState: boolean;
  items: { lineTotal: number; gstRate: number }[];
}) {
  const shares = allocateDiscount(order.subtotal, order.discount, order.items.map((i) => i.lineTotal));
  const totals = { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
  for (const [index, item] of order.items.entries()) {
    const split = splitInclusivePrice(shares[index], item.gstRate, order.intraState);
    totals.taxable += split.taxable;
    totals.cgst += split.cgst;
    totals.sgst += split.sgst;
    totals.igst += split.igst;
  }
  return totals;
}

/**
 * What was actually charged for each line after the coupon discount, shared by line value.
 * The rounding leftover goes to the last line, so the shares always add up to subtotal - discount.
 */
export function allocateDiscount(subtotal: number, discount: number, lineTotals: number[]): number[] {
  const charged = subtotal - discount;
  if (subtotal <= 0 || lineTotals.length === 0) return lineTotals.map(() => 0);
  const shares = lineTotals.map((t) => Math.round((t / subtotal) * charged));
  shares[shares.length - 1] += charged - shares.reduce((a, b) => a + b, 0);
  return shares;
}
