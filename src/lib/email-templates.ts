import "server-only";
import { formatPrice } from "@/lib/format";
import { formatOrderNumber, type AddressSnapshot } from "@/lib/orders";
import { contact } from "@/lib/site";
import type { EmailMessage } from "@/lib/email";

// Plain, table-free HTML emails (work in Gmail/Outlook) plus a text version of each.
// Every value that came from a customer is escaped before it goes into HTML.

const BRAND = "#f97234";

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#242424">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
  <div style="font-size:26px;font-weight:bold;margin-bottom:16px">W<span style="color:${BRAND}">Mart</span></div>
  <div style="background:#ffffff;border-radius:16px;padding:24px">
    <h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(title)}</h1>
    ${bodyHtml}
  </div>
  <p style="font-size:12px;color:#777;margin-top:16px">WMart · ${escapeHtml(contact.phoneDisplay)} · ${escapeHtml(contact.email)}</p>
</div></body></html>`;
}

const p = (html: string) => `<p style="font-size:14px;line-height:1.6;margin:0 0 12px">${html}</p>`;
const button = (href: string, label: string) =>
  `<p style="margin:20px 0"><a href="${escapeHtml(href)}" style="background:${BRAND};color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold;font-size:14px;display:inline-block">${escapeHtml(label)}</a></p>`;

/** Contact form → the support inbox (reply goes straight to the customer). */
export function contactToSupport(m: { name: string; email: string; phone: string; message: string }, to: string): EmailMessage {
  const rows = [`Name: ${m.name}`, `Email: ${m.email}`, `Phone: ${m.phone || "–"}`];
  return {
    to,
    replyTo: m.email,
    subject: `Website message from ${m.name}`,
    text: `${rows.join("\n")}\n\n${m.message}`,
    html: layout(
      "New message from the website",
      p(rows.map(escapeHtml).join("<br>")) + p(escapeHtml(m.message).replace(/\n/g, "<br>")),
    ),
  };
}

/** Contact form → a copy for the customer. */
export function contactCopy(m: { name: string; email: string; message: string }): EmailMessage {
  return {
    to: m.email,
    subject: "We've received your message – WMart",
    text: `Hi ${m.name},\n\nThanks for writing to WMart. We'll reply within one working day.\n\nYour message:\n${m.message}`,
    html: layout(
      "Thanks, we've got your message",
      p(`Hi ${escapeHtml(m.name)}, thanks for writing to WMart. We'll reply within one working day.`) +
        p(`<span style="color:#777">Your message:</span><br>${escapeHtml(m.message).replace(/\n/g, "<br>")}`),
    ),
  };
}

export type ConfirmationOrder = {
  orderNumber: number;
  email: string;
  total: number;
  discount: number; // paise, 0 when no coupon
  couponCode: string | null;
  paymentMethod: "COD" | "PAYU";
  shippingAddress: AddressSnapshot;
  items: { title: string; quantity: number; lineTotal: number }[];
};

/** Sent after an order is placed. `trackUrl` is the Track your order page (works on any device). */
export function orderConfirmation(o: ConfirmationOrder, trackUrl: string): EmailMessage {
  const number = formatOrderNumber(o.orderNumber);
  const a = o.shippingAddress;
  const address = [a.fullName, a.line1, a.line2, `${a.city}, ${a.state} – ${a.pincode}`, a.phone].filter(Boolean) as string[];
  const payment = o.paymentMethod === "COD" ? "Cash on Delivery – pay the courier when it arrives" : "Paid online";
  const discountRow =
    o.discount > 0
      ? `<tr><td style="padding:6px 0;font-size:14px;color:#459647">Discount${o.couponCode ? ` (${escapeHtml(o.couponCode)})` : ""}</td><td style="padding:6px 0;font-size:14px;text-align:right;color:#459647">−${formatPrice(o.discount)}</td></tr>`
      : "";
  const itemRows = o.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;font-size:14px">${escapeHtml(i.title)} × ${i.quantity}</td><td style="padding:6px 0;font-size:14px;text-align:right;white-space:nowrap">${formatPrice(i.lineTotal)}</td></tr>`,
    )
    .join("");
  return {
    to: o.email,
    subject: `Order ${number} confirmed – WMart`,
    text: [
      `Thanks for your order ${number}!`,
      "",
      ...o.items.map((i) => `${i.title} × ${i.quantity} – ${formatPrice(i.lineTotal)}`),
      ...(o.discount > 0 ? [`Discount${o.couponCode ? ` (${o.couponCode})` : ""}: -${formatPrice(o.discount)}`] : []),
      `Total: ${formatPrice(o.total)} (incl. 18% GST, free shipping)`,
      `Payment: ${payment}`,
      "",
      "Delivering to:",
      ...address,
      "",
      `Check your order any time at ${trackUrl} with order number ${number} and this email address.`,
    ].join("\n"),
    html: layout(
      `Thanks for your order ${number}!`,
      p("We've received your order and will confirm it shortly. You'll get the Delhivery tracking number once it ships.") +
        `<table style="width:100%;border-collapse:collapse;border-top:1px solid #eee;border-bottom:1px solid #eee;margin:8px 0 12px">${itemRows}${discountRow}
          <tr><td style="padding:8px 0;font-size:14px;font-weight:bold">Total</td><td style="padding:8px 0;font-size:14px;font-weight:bold;text-align:right">${formatPrice(o.total)}</td></tr></table>` +
        p(`<span style="color:#777">Incl. 18% GST · Free shipping</span><br>${escapeHtml(payment)}`) +
        p(`<strong>Delivering to</strong><br>${address.map(escapeHtml).join("<br>")}`) +
        button(trackUrl, "Track your order") +
        p(`<span style="color:#777">Use order number <strong>${number}</strong> and this email address.</span>`),
    ),
  };
}

/** Password reset link (valid for a limited time, single use – see lib/password-reset.ts). */
export function passwordReset(name: string, email: string, resetUrl: string, validMinutes: number): EmailMessage {
  return {
    to: email,
    subject: "Reset your WMart password",
    text: `Hi ${name},\n\nUse this link to choose a new password (valid for ${validMinutes} minutes):\n${resetUrl}\n\nIf you didn't ask for this, you can ignore this email – your password stays the same.`,
    html: layout(
      "Reset your password",
      p(`Hi ${escapeHtml(name)}, use the button below to choose a new password. The link works for ${validMinutes} minutes.`) +
        button(resetUrl, "Choose a new password") +
        p(`<span style="color:#777">If you didn't ask for this, you can ignore this email – your password stays the same.</span>`),
    ),
  };
}
