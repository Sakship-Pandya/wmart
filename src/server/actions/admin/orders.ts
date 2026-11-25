"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { assignInvoiceNumber } from "@/server/invoice-number";
import { trackShipment } from "@/lib/delhivery";
import { applyTrackingUpdate, bookWithDelhivery } from "@/server/shipments";
import type { OrderStatus, PaymentStatus, ShipmentStatus } from "@/generated/prisma/enums";
import {
  PAYMENT_STATUSES,
  RESTOCK_STATUSES,
  SHIPMENT_STATUSES,
  allowedNextStatuses,
  orderStatusInfo,
  paymentStatusInfo,
  shipmentStatusLabel,
} from "@/lib/orders";

function revalidateOrder(orderId: string, customerId?: string | null) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  if (customerId) revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/customers");
}

const clean = (s: string | undefined | null, max = 500) => {
  const t = (s ?? "").trim();
  return t ? t.slice(0, max) : null;
};

/**
 * Moves an order to the next status (only along allowedNextStatuses).
 * Cancelling or returning puts the items back in stock, once.
 */
export async function updateOrderStatus(orderId: string, next: OrderStatus, note?: string) {
  const session = await requireAdmin();
  const message = clean(note);

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { status: true, customerId: true, couponId: true, items: { select: { productId: true, quantity: true } } },
  });
  if (!order) throw new Error("Order not found");
  if (!allowedNextStatuses[order.status].includes(next)) {
    throw new Error(`Cannot change an order from ${orderStatusInfo[order.status].label} to ${orderStatusInfo[next].label}.`);
  }
  if (next === "CANCELLED" && !message) throw new Error("Please give a reason for cancelling.");

  const now = new Date();
  const restock = RESTOCK_STATUSES.includes(next) && !RESTOCK_STATUSES.includes(order.status);

  await db.$transaction(async (tx) => {
    // Re-check inside the transaction so two admins can't apply the same change twice.
    const updated = await tx.order.updateMany({
      where: { id: orderId, status: order.status },
      data: {
        status: next,
        ...(next === "CONFIRMED" ? { confirmedAt: now } : {}),
        ...(next === "SHIPPED" ? { shippedAt: now } : {}),
        ...(next === "DELIVERED" ? { deliveredAt: now } : {}),
        ...(next === "CANCELLED" ? { cancelledAt: now, cancelReason: message } : {}),
      },
    });
    if (updated.count === 0) throw new Error("This order was changed by someone else. Reload the page and try again.");

    // Confirming an order issues its GST invoice number (same transaction, so no gaps on failure).
    const invoiceNumber = next === "CONFIRMED" ? await assignInvoiceNumber(tx, orderId, now) : null;

    // A cancelled order gives its coupon use back (per-customer counts already skip cancelled orders).
    if (next === "CANCELLED" && order.couponId) {
      await tx.coupon.updateMany({ where: { id: order.couponId, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
    }

    if (restock) {
      for (const item of order.items) {
        if (item.productId) {
          await tx.product.updateMany({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        }
      }
    }

    await tx.orderEvent.create({
      data: {
        orderId,
        type: `status:${next}`,
        message:
          [message, invoiceNumber ? `Invoice ${invoiceNumber} issued.` : null, restock ? "Items returned to stock." : null]
            .filter(Boolean)
            .join(" ") || null,
        actor: `admin:${session.email}`,
      },
    });
  });

  revalidateOrder(orderId, order.customerId);
  revalidatePath("/admin/products");
  return { success: true };
}

/** e.g. mark a COD order as paid once Delhivery remits the cash, or record a refund. */
export async function updatePaymentStatus(orderId: string, status: PaymentStatus, note?: string) {
  const session = await requireAdmin();
  if (!(PAYMENT_STATUSES as readonly string[]).includes(status)) throw new Error("Unknown payment status");

  const order = await db.order.findUnique({ where: { id: orderId }, select: { paymentStatus: true, customerId: true } });
  if (!order) throw new Error("Order not found");
  if (order.paymentStatus === status) return { success: true };

  await db.$transaction([
    db.order.update({ where: { id: orderId }, data: { paymentStatus: status } }),
    db.orderEvent.create({
      data: {
        orderId,
        type: `payment:${status}`,
        message: clean(note) ?? `Payment marked ${paymentStatusInfo[status].label.toLowerCase()}`,
        actor: `admin:${session.email}`,
      },
    }),
  ]);
  revalidateOrder(orderId, order.customerId);
  return { success: true };
}

/** Saves the Delhivery AWB and shipment status on the order's latest shipment (creates one if needed). */
export async function saveShipment(orderId: string, input: { awb: string; status: ShipmentStatus }) {
  const session = await requireAdmin();
  if (!(SHIPMENT_STATUSES as readonly string[]).includes(input.status)) throw new Error("Unknown shipment status");
  const awb = clean(input.awb, 40);
  if (awb && !/^[A-Za-z0-9-]{6,40}$/.test(awb)) throw new Error("The AWB number should be 6–40 letters or digits.");
  if (!awb && input.status !== "PENDING") throw new Error("Enter the Delhivery AWB number first.");

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { customerId: true, total: true, paymentMethod: true, shipments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!order) throw new Error("Order not found");

  if (awb) {
    const clash = await db.shipment.findFirst({ where: { awb, NOT: { orderId } } });
    if (clash) throw new Error("This AWB number is already used by another order.");
  }

  const now = new Date();
  const data = {
    awb,
    status: input.status,
    ...(input.status === "DELIVERED" ? { deliveredAt: now } : {}),
    ...(["PICKED_UP", "IN_TRANSIT"].includes(input.status) ? { shippedAt: now } : {}),
  };
  const existing = order.shipments[0];

  await db.$transaction([
    existing
      ? db.shipment.update({ where: { id: existing.id }, data })
      : db.shipment.create({
          data: { orderId, ...data, codAmount: order.paymentMethod === "COD" ? order.total : 0 },
        }),
    db.orderEvent.create({
      data: {
        orderId,
        type: `shipment:${input.status}`,
        message: `${shipmentStatusLabel[input.status]}${awb ? ` · AWB ${awb}` : ""}`,
        actor: `admin:${session.email}`,
      },
    }),
  ]);
  revalidateOrder(orderId, order.customerId);
  return { success: true };
}

export type DelhiveryActionResult = { ok: true; message: string } | { ok: false; error: string };

/** Books the order with Delhivery (creates the AWB). Errors are returned, not thrown, so the admin sees the reason. */
export async function bookDelhiveryShipment(orderId: string): Promise<DelhiveryActionResult> {
  const session = await requireAdmin();
  try {
    const awb = await bookWithDelhivery(orderId, `admin:${session.email}`);
    return { ok: true, message: `Booked with Delhivery – AWB ${awb}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Couldn't book with Delhivery." };
  }
}

/** Pulls the latest Delhivery scan for the order's AWB and applies it. */
export async function refreshDelhiveryTracking(orderId: string): Promise<DelhiveryActionResult> {
  await requireAdmin();
  try {
    const shipment = await db.shipment.findFirst({
      where: { orderId, awb: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { awb: true },
    });
    if (!shipment?.awb) return { ok: false, error: "This order has no AWB yet." };
    const update = await trackShipment(shipment.awb);
    if (!update) return { ok: false, error: "Delhivery has no tracking for this AWB yet." };
    await applyTrackingUpdate(shipment.awb, update, "delhivery");
    return { ok: true, message: update.text ? `Latest: ${update.text}` : "Tracking updated" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Couldn't reach Delhivery." };
  }
}

/** Private note on the order timeline (not shown to the customer). */
export async function addOrderNote(orderId: string, note: string) {
  const session = await requireAdmin();
  const message = clean(note, 1000);
  if (!message) throw new Error("Write a note first.");
  const order = await db.order.findUnique({ where: { id: orderId }, select: { customerId: true } });
  if (!order) throw new Error("Order not found");
  await db.orderEvent.create({ data: { orderId, type: "note", message, actor: `admin:${session.email}` } });
  revalidateOrder(orderId, order.customerId);
  return { success: true };
}

/**
 * Issues the GST invoice number for an order that is past "Pending" but has none yet
 * (e.g. confirmed before invoices existed). Cancelled and pending orders get no invoice.
 */
export async function generateInvoice(orderId: string) {
  const session = await requireAdmin();
  const order = await db.order.findUnique({ where: { id: orderId }, select: { status: true, invoiceNumber: true, customerId: true } });
  if (!order) throw new Error("Order not found");
  if (order.invoiceNumber) return { success: true, invoiceNumber: order.invoiceNumber };
  if (order.status === "PENDING" || order.status === "CANCELLED") {
    throw new Error("Confirm the order first. Pending and cancelled orders don't get an invoice.");
  }
  const invoiceNumber = await db.$transaction(async (tx) => {
    const number = await assignInvoiceNumber(tx, orderId);
    await tx.orderEvent.create({ data: { orderId, type: "note", message: `Invoice ${number} issued.`, actor: `admin:${session.email}` } });
    return number;
  });
  revalidateOrder(orderId, order.customerId);
  return { success: true, invoiceNumber };
}
