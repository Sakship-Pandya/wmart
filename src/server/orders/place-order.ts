import "server-only";
import { db } from "@/lib/db";
import { isIntraState, type AddressSnapshot } from "@/lib/orders";
import type { CartCookieLine } from "@/lib/cart-cookie";

/** A problem the customer can fix (e.g. not enough stock); its message is shown at checkout. */
export class CheckoutError extends Error {}

export interface PlaceOrderInput {
  lines: CartCookieLine[]; // product ids + quantities from the cart cookie
  email: string;
  shipping: AddressSnapshot;
  billing: AddressSnapshot;
  notes: string;
  paymentMethod: "COD" | "PAYU";
  customerId: string | null;
}

/**
 * Creates an order in one transaction:
 * - prices, titles, HSN and GST come from the database, never from the browser;
 * - stock is reduced only if enough is left (checked in the same UPDATE, so two
 *   customers can't both buy the last unit);
 * - the order keeps a copy of every line and both addresses.
 * Totals: free shipping, no COD fee and no coupon yet (decisions pending).
 */
export async function placeOrder(input: PlaceOrderInput): Promise<{ id: string; orderNumber: number }> {
  // Merge duplicate lines for the same product.
  const qty = new Map<string, number>();
  for (const l of input.lines) qty.set(l.p, (qty.get(l.p) ?? 0) + l.q);
  if (qty.size === 0) throw new CheckoutError("Your cart is empty – add a product before checking out.");

  return db.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: [...qty.keys()] }, isActive: true },
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        mrp: true,
        stock: true,
        hsnCode: true,
        gstRate: true,
        images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
      },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    const items = [];
    for (const [productId, quantity] of qty) {
      const p = byId.get(productId);
      if (!p) throw new CheckoutError("A product in your cart is no longer available. Please review your cart.");
      // Reduce stock only if enough is left – the WHERE makes this safe against parallel orders.
      const taken = await tx.product.updateMany({
        where: { id: productId, isActive: true, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } },
      });
      if (taken.count === 0) {
        throw new CheckoutError(
          p.stock > 0
            ? `Only ${p.stock} left of "${p.title}". Please lower the quantity in your cart.`
            : `"${p.title}" just went out of stock. Please remove it from your cart.`,
        );
      }
      items.push({
        productId,
        title: p.title,
        slug: p.slug,
        imageUrl: p.images[0]?.url ?? null,
        hsnCode: p.hsnCode,
        gstRate: p.gstRate,
        unitPrice: p.price,
        mrp: Math.max(p.mrp, p.price),
        quantity,
        lineTotal: p.price * quantity,
      });
    }

    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const shippingFee = 0; // free shipping on all orders (current site)
    const codFee = 0; // decision pending
    const discount = 0; // coupons at checkout: not connected yet
    const total = subtotal - discount + shippingFee + codFee;

    const order = await tx.order.create({
      data: {
        customerId: input.customerId,
        email: input.email.toLowerCase(),
        phone: input.shipping.phone,
        status: "PENDING",
        paymentMethod: input.paymentMethod,
        paymentStatus: "PENDING",
        shippingAddress: input.shipping,
        billingAddress: input.billing,
        // Goods: place of supply is where they are delivered.
        placeOfSupply: input.shipping.state,
        intraState: isIntraState(input.shipping.state),
        notes: input.notes || null,
        subtotal,
        discount,
        shippingFee,
        codFee,
        total,
        items: { create: items },
        events: {
          create: {
            type: "status:PENDING",
            message: input.paymentMethod === "COD" ? "Order placed (Cash on Delivery) – waiting for confirmation" : "Order placed – waiting for payment",
            actor: "customer",
          },
        },
      },
      select: { id: true, orderNumber: true },
    });
    return order;
  });
}
