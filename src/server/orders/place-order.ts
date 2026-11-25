import "server-only";
import { db } from "@/lib/db";
import { isIntraState, type AddressSnapshot } from "@/lib/orders";
import type { CartCookieLine } from "@/lib/cart-cookie";
import { couponDiscount, couponProblem } from "@/lib/coupons";

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
  couponCode?: string; // code applied in the cart (re-checked here)
}

/**
 * How many times this email has used a coupon: its orders with that coupon, not counting
 * cancelled ones (cancelling gives the use back). Emails are stored lower-case.
 */
export async function countCouponUses(couponId: string, email: string, client: Pick<typeof db, "order"> = db): Promise<number> {
  return client.order.count({ where: { couponId, email: email.toLowerCase(), status: { not: "CANCELLED" } } });
}

/**
 * Creates an order in one transaction:
 * - prices, titles, HSN and GST come from the database, never from the browser;
 * - stock is reduced only if enough is left (checked in the same UPDATE, so two
 *   customers can't both buy the last unit);
 * - the order keeps a copy of every line and both addresses.
 * Totals: free shipping and no COD fee (decisions pending); the cart coupon, if valid.
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

    // Coupon: every rule is checked again here (it may have expired or run out since it was
    // applied in the cart), and one use is claimed atomically, so two orders can't both take
    // a coupon's last use.
    let discount = 0;
    let couponId: string | null = null;
    let couponCode: string | null = null;
    if (input.couponCode) {
      const coupon = await tx.coupon.findUnique({ where: { code: input.couponCode } });
      if (!coupon) throw new CheckoutError(`The code ${input.couponCode} no longer exists. Remove it from your cart to continue.`);
      const problem = couponProblem(coupon, subtotal);
      if (problem) throw new CheckoutError(`${problem} Remove it from your cart to continue.`);
      if (coupon.perCustomerLimit !== null && (await countCouponUses(coupon.id, input.email, tx)) >= coupon.perCustomerLimit) {
        throw new CheckoutError(`The code ${coupon.code} has already been used with ${input.email.toLowerCase()}. Remove it from your cart to continue.`);
      }
      const claimed = await tx.coupon.updateMany({
        where: { id: coupon.id, ...(coupon.usageLimit !== null ? { usedCount: { lt: coupon.usageLimit } } : {}) },
        data: { usedCount: { increment: 1 } },
      });
      if (claimed.count === 0) throw new CheckoutError(`The code ${coupon.code} has just been fully used. Remove it from your cart to continue.`);
      discount = couponDiscount(coupon, subtotal);
      couponId = coupon.id;
      couponCode = coupon.code;
    }
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
        couponId,
        couponCode,
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
