import "server-only";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createShipment, type TrackingUpdate } from "@/lib/delhivery";
import { sellerDetails } from "@/lib/invoice";
import { asAddress, formatOrderNumber, shipmentStatusLabel } from "@/lib/orders";
import type { OrderStatus } from "@/generated/prisma/enums";

// Shared by the admin buttons (book / refresh tracking) and the Delhivery webhook.

function revalidate(orderId: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
}

/** "Delivered" + "Delivered · Ahmedabad" → "Delivered · Ahmedabad" (no repeated word). */
function eventMessage(label: string | null, text: string): string {
  if (!label) return text || "Delhivery update";
  if (!text) return label;
  return text.toLowerCase().startsWith(label.toLowerCase()) ? text : `${label} · ${text}`;
}

/** Books the order with Delhivery and saves the AWB on its shipment. Returns the AWB. */
export async function bookWithDelhivery(orderId: string, actor: string): Promise<string> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      orderNumber: true,
      createdAt: true,
      status: true,
      paymentMethod: true,
      total: true,
      shippingAddress: true,
      items: { select: { title: true, quantity: true, hsnCode: true } },
      shipments: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, awb: true } },
    },
  });
  if (!order) throw new Error("Order not found");
  if (order.shipments[0]?.awb) throw new Error(`Already booked – AWB ${order.shipments[0].awb}.`);
  if (!["CONFIRMED", "PACKED"].includes(order.status)) throw new Error("Confirm the order before booking the shipment.");
  const address = asAddress(order.shippingAddress);
  if (!address) throw new Error("This order has no valid shipping address.");

  const seller = sellerDetails();
  const { awb } = await createShipment({
    orderNumber: formatOrderNumber(order.orderNumber),
    createdAt: order.createdAt,
    paymentMethod: order.paymentMethod,
    total: order.total,
    address,
    items: order.items,
    seller: { name: seller.legalName, gstin: seller.gstinValid ? seller.gstin : "", address: seller.addressLines.join(", ") },
  });

  const data = { awb, status: "MANIFESTED" as const, lastUpdate: "Booked with Delhivery" };
  const existing = order.shipments[0];
  await db.$transaction([
    existing
      ? db.shipment.update({ where: { id: existing.id }, data })
      : db.shipment.create({ data: { orderId, ...data, codAmount: order.paymentMethod === "COD" ? order.total : 0 } }),
    db.orderEvent.create({
      data: { orderId, type: "shipment:MANIFESTED", message: `Booked with Delhivery · AWB ${awb}`, actor },
    }),
  ]);
  revalidate(orderId);
  return awb;
}

/**
 * Saves a Delhivery scan on the shipment with this AWB and moves the order along:
 * picked up / in transit / out for delivery → SHIPPED, delivered → DELIVERED.
 * Returns to us (RTO) are only noted on the timeline – staff mark the order Returned,
 * which also puts the stock back.
 */
export async function applyTrackingUpdate(awb: string, update: TrackingUpdate, actor: string): Promise<boolean> {
  const shipment = await db.shipment.findUnique({
    where: { awb },
    select: { id: true, status: true, lastUpdate: true, orderId: true, order: { select: { status: true } } },
  });
  if (!shipment) return false;
  const statusChanged = update.status !== null && update.status !== shipment.status;
  if (!statusChanged && update.text === shipment.lastUpdate) return true; // duplicate scan

  const now = update.at ?? new Date();
  const s = update.status;
  const moving = s === "PICKED_UP" || s === "IN_TRANSIT" || s === "OUT_FOR_DELIVERY";
  const current = shipment.order.status;
  let nextOrder: OrderStatus | null = null;
  if (s === "DELIVERED" && ["CONFIRMED", "PACKED", "SHIPPED"].includes(current)) nextOrder = "DELIVERED";
  else if (moving && ["CONFIRMED", "PACKED"].includes(current)) nextOrder = "SHIPPED";

  await db.$transaction([
    db.shipment.update({
      where: { id: shipment.id },
      data: {
        lastUpdate: update.text || shipment.lastUpdate,
        ...(statusChanged ? { status: s! } : {}),
        ...(moving && statusChanged ? { shippedAt: now } : {}),
        ...(s === "DELIVERED" ? { deliveredAt: now } : {}),
      },
    }),
    ...(nextOrder
      ? [
          db.order.update({
            where: { id: shipment.orderId },
            data: {
              status: nextOrder,
              ...(nextOrder === "SHIPPED" ? { shippedAt: now } : {}),
              ...(nextOrder === "DELIVERED" ? { deliveredAt: now } : {}),
            },
          }),
        ]
      : []),
    db.orderEvent.create({
      data: {
        orderId: shipment.orderId,
        type: statusChanged ? `shipment:${s}` : "note",
        message: eventMessage(statusChanged ? shipmentStatusLabel[s!] : null, update.text),
        actor,
      },
    }),
  ]);
  revalidate(shipment.orderId);
  return true;
}
