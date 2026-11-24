// GST tax invoice: seller details, invoice numbering format and the invoice lines.
// Pure functions (no database), shared by the admin invoice page and, later, the
// customer's "Download invoice" in My account.
import { business, contact } from "@/lib/site";
import { splitInclusivePrice } from "@/lib/gst";
import { gstStateCode } from "@/lib/gst-states";
import { SELLER_STATE, allocateDiscount, asAddress, formatOrderNumber, type AddressSnapshot } from "@/lib/orders";

/** Seller block printed on every invoice. GSTIN comes from .env (SELLER_GSTIN). */
export function sellerDetails() {
  const gstin = (process.env.SELLER_GSTIN ?? "").trim().toUpperCase();
  return {
    legalName: process.env.SELLER_LEGAL_NAME?.trim() || business.legalName,
    tradeName: "WMart",
    addressLines: contact.addressLines,
    state: SELLER_STATE,
    stateCode: gstStateCode(SELLER_STATE),
    gstin,
    gstinValid: /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin),
    email: contact.email,
    phone: contact.phoneDisplay,
  };
}

/** Prefix before the financial year, e.g. "WM" in WM/2026-27/0001. Set INVOICE_PREFIX in .env. */
export function invoicePrefix(): string {
  const p = (process.env.INVOICE_PREFIX ?? "WM").trim().toUpperCase();
  return /^[A-Z0-9-]{1,10}$/.test(p) ? p : "WM";
}

/** Indian financial year (1 April – 31 March, IST) of a date: "2026-27". */
export function financialYear(date: Date): string {
  const ist = new Date(date.getTime() + 5.5 * 3600 * 1000);
  const start = ist.getUTCMonth() >= 3 ? ist.getUTCFullYear() : ist.getUTCFullYear() - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

/** "WM/2026-27/" — invoice numbers in one financial year share this start and count up from 0001. */
export function invoiceSeriesPrefix(date: Date): string {
  return `${invoicePrefix()}/${financialYear(date)}/`;
}

export function formatInvoiceNumber(date: Date, sequence: number): string {
  return `${invoiceSeriesPrefix(date)}${String(sequence).padStart(4, "0")}`;
}

// Shipping / COD charges, if ever added, are invoiced as a service.
// SAC 996812 (courier services) at 18% – CONFIRM WITH YOUR ACCOUNTANT before charging fees.
const FEE_SAC = "996812";
const FEE_GST_RATE = 18;

export interface InvoiceLine {
  description: string;
  hsn: string;
  quantity: number;
  unitTaxable: number; // paise per unit, before GST
  taxable: number; // paise
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number; // paise, GST included
}

type InvoiceOrder = {
  orderNumber: number;
  createdAt: Date;
  invoiceNumber: string | null;
  invoicedAt: Date | null;
  email: string;
  phone: string;
  shippingAddress: unknown;
  billingAddress: unknown;
  placeOfSupply: string;
  intraState: boolean;
  paymentMethod: "PAYU" | "COD";
  subtotal: number;
  discount: number;
  shippingFee: number;
  codFee: number;
  total: number;
  couponCode: string | null;
  items: { title: string; hsnCode: string | null; gstRate: number; quantity: number; lineTotal: number }[];
};

function line(description: string, hsn: string, quantity: number, inclusive: number, gstRate: number, intraState: boolean): InvoiceLine {
  const split = splitInclusivePrice(inclusive, gstRate, intraState);
  return {
    description,
    hsn,
    quantity,
    unitTaxable: quantity > 0 ? Math.round(split.taxable / quantity) : 0,
    taxable: split.taxable,
    gstRate,
    cgst: split.cgst,
    sgst: split.sgst,
    igst: split.igst,
    total: inclusive,
  };
}

/** Everything the invoice page prints, worked out from an order. */
export function buildInvoice(order: InvoiceOrder) {
  // Coupon discount is shared across the product lines, so each line shows what was actually charged.
  const shares = allocateDiscount(order.subtotal, order.discount, order.items.map((i) => i.lineTotal));
  const lines: InvoiceLine[] = order.items.map((item, i) =>
    line(item.title, item.hsnCode ?? "", item.quantity, shares[i], item.gstRate, order.intraState),
  );
  if (order.shippingFee > 0) lines.push(line("Shipping charges", FEE_SAC, 1, order.shippingFee, FEE_GST_RATE, order.intraState));
  if (order.codFee > 0) lines.push(line("Cash on Delivery charges", FEE_SAC, 1, order.codFee, FEE_GST_RATE, order.intraState));

  const sum = (k: keyof Pick<InvoiceLine, "taxable" | "cgst" | "sgst" | "igst" | "total">) => lines.reduce((s, l) => s + l[k], 0);
  const billing = asAddress(order.billingAddress);
  const shipping = asAddress(order.shippingAddress);

  // GST summary grouped by HSN + rate (needed on invoices and for GSTR-1).
  const byHsn = new Map<string, { hsn: string; gstRate: number; taxable: number; cgst: number; sgst: number; igst: number }>();
  for (const l of lines) {
    const key = `${l.hsn}|${l.gstRate}`;
    const row = byHsn.get(key) ?? { hsn: l.hsn, gstRate: l.gstRate, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    row.taxable += l.taxable;
    row.cgst += l.cgst;
    row.sgst += l.sgst;
    row.igst += l.igst;
    byHsn.set(key, row);
  }

  return {
    invoiceNumber: order.invoiceNumber,
    invoiceDate: order.invoicedAt ?? order.createdAt,
    orderNumber: formatOrderNumber(order.orderNumber),
    orderDate: order.createdAt,
    paymentMethod: order.paymentMethod === "COD" ? "Cash on Delivery" : "Prepaid (PayU)",
    seller: sellerDetails(),
    buyer: { billing, shipping, email: order.email, phone: order.phone },
    placeOfSupply: order.placeOfSupply,
    placeOfSupplyCode: gstStateCode(order.placeOfSupply),
    intraState: order.intraState,
    couponCode: order.couponCode,
    discount: order.discount,
    lines,
    hsnSummary: [...byHsn.values()],
    totals: { taxable: sum("taxable"), cgst: sum("cgst"), sgst: sum("sgst"), igst: sum("igst"), total: sum("total") },
    // Should always equal Order.total; the page warns if it doesn't.
    matchesOrderTotal: sum("total") === order.total,
    missingHsn: lines.some((l) => !l.hsn),
  };
}

export type Invoice = ReturnType<typeof buildInvoice>;
export type { AddressSnapshot };
