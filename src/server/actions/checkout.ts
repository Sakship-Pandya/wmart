"use server";

import { after } from "next/server";
import { checkPincode } from "@/lib/delhivery";
import { sendEmail } from "@/lib/email";
import { orderConfirmation } from "@/lib/email-templates";
import { siteUrl } from "@/lib/site-url";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addressSchema, checkoutSchema, type FormState } from "@/lib/validation/forms";
import { fieldErrorsFrom, text } from "@/lib/validation/errors";
import { getCart } from "@/server/queries/cart";
import { readCartCookie, writeCartCookie } from "@/lib/cart-cookie";
import { readCouponCookie, writeCouponCookie } from "@/server/coupons";
import { getCurrentCustomer } from "@/lib/customer-session";
import { grantOrderAccess } from "@/lib/order-access";
import { db } from "@/lib/db";
import { asAddress, type AddressSnapshot } from "@/lib/orders";
import { CheckoutError, placeOrder as createOrder } from "@/server/orders/place-order";

const addressFields = ["fullName", "phone", "line1", "line2", "city", "state", "pincode"] as const;

function readAddress(formData: FormData, prefix: "shipping" | "billing") {
  return Object.fromEntries(addressFields.map((f) => [f, text(formData, `${prefix}.${f}`)]));
}

/**
 * Place order. Validates the form, re-checks the cart on the server and saves the order
 * (prices and stock from the database). Cash on Delivery orders start as Pending until the
 * team confirms them in the admin panel. PayU is not connected yet.
 */
export async function placeOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const shipping = readAddress(formData, "shipping");
  const billing = readAddress(formData, "billing");
  const billingSameAsShipping = formData.get("billingSameAsShipping") === "on";
  const input = {
    email: text(formData, "email"),
    shipping,
    billingSameAsShipping,
    // The billing fields are hidden (and sent empty) when billing = shipping; don't validate them then.
    billing: billingSameAsShipping ? {} : billing,
    notes: text(formData, "notes"),
    paymentMethod: text(formData, "paymentMethod"),
  };

  // Values to put back in the form after an error.
  const values: Record<string, string> = {
    email: input.email,
    notes: input.notes,
    paymentMethod: input.paymentMethod,
    billingSameAsShipping: billingSameAsShipping ? "on" : "",
  };
  for (const f of addressFields) {
    values[`shipping.${f}`] = shipping[f];
    values[`billing.${f}`] = billing[f];
  }

  const cart = await getCart();
  if (cart.lines.length === 0) {
    return { status: "error", message: "Your cart is empty – add a product before checking out.", values };
  }

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
      values,
    };
  }

  const data = parsed.data;
  if (data.paymentMethod === "payu") {
    // TODO: PayU (needs PAYU_MERCHANT_KEY / PAYU_SALT): create the order with a Payment row,
    // post the customer to PayU and mark it paid in /api/webhooks/payu after verifying the hash.
    return {
      status: "error",
      message: "Online payment with PayU isn't connected yet. Please choose Cash on Delivery to place your order.",
      values,
    };
  }

  const shippingAddress = data.shipping;

  // Delhivery serviceability (only when Delhivery is connected). If Delhivery can't be reached,
  // the order still goes through – staff check the address before booking the shipment.
  try {
    const service = await checkPincode(shippingAddress.pincode);
    if (service && !service.serviceable) {
      return {
        status: "error",
        message: "Delhivery doesn't deliver to this pincode yet. Please use another address, or message us on WhatsApp.",
        fieldErrors: { "shipping.pincode": ["Delivery isn't available to this pincode."] },
        values,
      };
    }
    if (service && !service.cod) {
      return {
        status: "error",
        message: "Cash on Delivery isn't available for this pincode. Online payment is coming soon – message us on WhatsApp to order.",
        fieldErrors: { "shipping.pincode": ["Cash on Delivery isn't available here."] },
        values,
      };
    }
  } catch (err) {
    console.error("checkout pincode check failed", err);
  }

  const billingAddress = data.billingSameAsShipping ? data.shipping : addressSchema.parse(data.billing);
  const customer = await getCurrentCustomer();

  let order: { id: string; orderNumber: number };
  try {
    order = await createOrder({
      lines: await readCartCookie(),
      couponCode: (await readCouponCookie()) || undefined,
      email: data.email,
      shipping: shippingAddress,
      billing: billingAddress,
      notes: data.notes,
      paymentMethod: "COD",
      customerId: customer?.id ?? null,
    });
  } catch (err) {
    if (err instanceof CheckoutError) return { status: "error", message: err.message, values };
    console.error("placeOrder failed", err);
    return { status: "error", message: "Sorry, we couldn't place your order. Please try again in a moment.", values };
  }

  // Order saved: empty the cart, remember the addresses for next time, open the confirmation page.
  await writeCartCookie([]);
  await writeCouponCookie("");
  if (customer) await saveMissingAddresses(customer.id, shippingAddress, billingAddress);
  await grantOrderAccess(order.id);
  // Confirmation email after the response, so a slow email service never delays the order page.
  const trackUrl = `${await siteUrl()}/track-order`;
  after(() => sendOrderConfirmation(order.id, trackUrl));
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  redirect(`/order/${order.id}?placed=1`);
}

/** Saves the checkout addresses to My account → Addresses, only where the customer has none saved yet. */
async function saveMissingAddresses(customerId: string, shipping: AddressSnapshot, billing: AddressSnapshot) {
  try {
    const existing = await db.address.findMany({ where: { customerId }, select: { type: true } });
    const has = new Set(existing.map((a) => a.type));
    const toCreate = [
      ...(has.has("SHIPPING") ? [] : [{ customerId, type: "SHIPPING" as const, ...shipping, line2: shipping.line2 || null }]),
      ...(has.has("BILLING") ? [] : [{ customerId, type: "BILLING" as const, ...billing, line2: billing.line2 || null }]),
    ];
    if (toCreate.length) await db.address.createMany({ data: toCreate, skipDuplicates: true });
  } catch (err) {
    // Never fail a placed order because of this convenience step.
    console.error("saving checkout addresses failed", err);
  }
}

async function sendOrderConfirmation(orderId: string, trackUrl: string) {
  try {
    const o = await db.order.findUnique({
      where: { id: orderId },
      select: {
        orderNumber: true,
        email: true,
        total: true,
        discount: true,
        couponCode: true,
        paymentMethod: true,
        shippingAddress: true,
        items: { select: { title: true, quantity: true, lineTotal: true } },
      },
    });
    const address = o && asAddress(o.shippingAddress);
    if (!o || !address) return;
    await sendEmail(orderConfirmation({ ...o, shippingAddress: address }, trackUrl));
  } catch (err) {
    console.error("order confirmation email failed", err);
  }
}
