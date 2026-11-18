"use server";

import { checkoutSchema, type FormState } from "@/lib/validation/forms";
import { fieldErrorsFrom, text } from "@/lib/validation/errors";
import { getCart } from "@/server/queries/cart";

const addressFields = ["fullName", "phone", "line1", "line2", "city", "state", "pincode"] as const;

function readAddress(formData: FormData, prefix: "shipping" | "billing") {
  return Object.fromEntries(addressFields.map((f) => [f, text(formData, `${prefix}.${f}`)]));
}

/**
 * Place order. Validates the form and re-checks the cart on the server.
 * TODO (needs Order tables + PayU/Delhivery set-up):
 * - create the Order + OrderItems with prices taken from the database, reduce stock;
 * - paymentMethod "payu": build the PayU request (txnid, amount, productinfo, firstname, email, phone,
 *   surl/furl = /api/webhooks/payu, SHA-512 hash with PAYU_SALT) and send the customer to PayU;
 * - paymentMethod "cod": mark the order as confirmed (to be paid to the Delhivery courier);
 * - redirect to /order/<id> (order confirmation page).
 */
export async function placeOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const shipping = readAddress(formData, "shipping");
  const billing = readAddress(formData, "billing");
  const billingSameAsShipping = formData.get("billingSameAsShipping") === "on";
  const input = {
    email: text(formData, "email"),
    shipping,
    billingSameAsShipping,
    billing,
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

  return {
    status: "error",
    message:
      parsed.data.paymentMethod === "payu"
        ? "Everything looks good! Online payment with PayU isn't connected yet, so the order can't be placed."
        : "Everything looks good! Placing Cash on Delivery orders isn't connected yet, so the order can't be placed.",
    values,
  };
}
