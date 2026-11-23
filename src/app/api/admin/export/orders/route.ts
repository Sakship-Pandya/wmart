// Orders CSV export (admin only), for accounting and GST returns.
//   GET /api/admin/export/orders?status=&payment=&method=&q=&from=YYYY-MM-DD&to=YYYY-MM-DD&rows=items
// Same filters as the admin Orders page. Dates are IST days, both inclusive.
// Default: one row per order. rows=items: one row per product line (HSN-wise reporting).
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { buildAdminOrderWhere } from "@/server/queries/admin/orders";
import { csvResponse, rupees, toCsv, todayIST } from "@/lib/csv";
import {
  asAddress,
  formatDateTimeIST,
  formatOrderNumber,
  orderGstSplit,
  orderStatusInfo,
  paymentStatusInfo,
  shipmentStatusLabel,
} from "@/lib/orders";
import { splitInclusivePrice } from "@/lib/gst";

const ORDER_COLUMNS = [
  "order_number",
  "date_ist",
  "status",
  "payment_method",
  "payment_status",
  "customer_name",
  "email",
  "phone",
  "city",
  "state",
  "pincode",
  "items",
  "item_count",
  "subtotal",
  "discount",
  "coupon",
  "shipping_fee",
  "cod_fee",
  "total",
  "taxable_value",
  "cgst",
  "sgst",
  "igst",
  "place_of_supply",
  "invoice_number",
  "awb",
  "shipment_status",
  "customer_note",
] as const;

const ITEM_COLUMNS = [
  "order_number",
  "date_ist",
  "status",
  "invoice_number",
  "customer_name",
  "state",
  "product",
  "hsn_code",
  "gst_rate",
  "quantity",
  "unit_price",
  "line_total",
  "line_after_discount",
  "taxable_value",
  "cgst",
  "sgst",
  "igst",
] as const;

/** "2026-11-01" -> midnight IST that day (as UTC). */
function istDayStart(s: string | null): Date | undefined {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const d = new Date(`${s}T00:00:00+05:30`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function GET(request: Request) {
  if (!(await getAdminSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const p = new URL(request.url).searchParams;
  const from = istDayStart(p.get("from"));
  const toStart = istDayStart(p.get("to"));
  const to = toStart ? new Date(toStart.getTime() + 24 * 3600 * 1000) : undefined; // inclusive end day

  const where = buildAdminOrderWhere({
    status: p.get("status") ?? undefined,
    payment: p.get("payment") ?? undefined,
    method: p.get("method") ?? undefined,
    q: p.get("q") ?? undefined,
    from,
    to,
  });

  const orders = await db.order.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: {
      items: { orderBy: { title: "asc" } },
      shipments: { orderBy: { createdAt: "desc" }, take: 1, select: { awb: true, status: true } },
    },
  });

  const range = `${p.get("from") ?? "all"}_to_${p.get("to") ?? todayIST()}`;

  if (p.get("rows") === "items") {
    const rows = orders.flatMap((o) => {
      const ship = asAddress(o.shippingAddress);
      const charged = o.subtotal - o.discount;
      return o.items.map((i) => {
        const after = o.subtotal > 0 ? Math.round((i.lineTotal / o.subtotal) * charged) : 0;
        const tax = splitInclusivePrice(after, i.gstRate, o.intraState);
        return {
          order_number: formatOrderNumber(o.orderNumber),
          date_ist: formatDateTimeIST(o.createdAt),
          status: orderStatusInfo[o.status].label,
          invoice_number: o.invoiceNumber ?? "",
          customer_name: ship?.fullName ?? "",
          state: o.placeOfSupply,
          product: i.title,
          hsn_code: i.hsnCode ?? "",
          gst_rate: i.gstRate,
          quantity: i.quantity,
          unit_price: rupees(i.unitPrice),
          line_total: rupees(i.lineTotal),
          line_after_discount: rupees(after),
          taxable_value: rupees(tax.taxable),
          cgst: rupees(tax.cgst),
          sgst: rupees(tax.sgst),
          igst: rupees(tax.igst),
        };
      });
    });
    return csvResponse(toCsv(ITEM_COLUMNS, rows), `wmart-order-items-${range}.csv`);
  }

  const rows = orders.map((o) => {
    const ship = asAddress(o.shippingAddress);
    const gst = orderGstSplit(o);
    const shipment = o.shipments[0];
    return {
      order_number: formatOrderNumber(o.orderNumber),
      date_ist: formatDateTimeIST(o.createdAt),
      status: orderStatusInfo[o.status].label,
      payment_method: o.paymentMethod === "COD" ? "COD" : "PayU",
      payment_status: paymentStatusInfo[o.paymentStatus].label,
      customer_name: ship?.fullName ?? "",
      email: o.email,
      phone: o.phone,
      city: ship?.city ?? "",
      state: ship?.state ?? "",
      pincode: ship?.pincode ?? "",
      items: o.items.map((i) => `${i.title} x${i.quantity}`).join("; "),
      item_count: o.items.reduce((s, i) => s + i.quantity, 0),
      subtotal: rupees(o.subtotal),
      discount: rupees(o.discount),
      coupon: o.couponCode ?? "",
      shipping_fee: rupees(o.shippingFee),
      cod_fee: rupees(o.codFee),
      total: rupees(o.total),
      taxable_value: rupees(gst.taxable),
      cgst: rupees(gst.cgst),
      sgst: rupees(gst.sgst),
      igst: rupees(gst.igst),
      place_of_supply: o.placeOfSupply,
      invoice_number: o.invoiceNumber ?? "",
      awb: shipment?.awb ?? "",
      shipment_status: shipment ? shipmentStatusLabel[shipment.status] : "",
      customer_note: o.notes ?? "",
    };
  });
  return csvResponse(toCsv(ORDER_COLUMNS, rows), `wmart-orders-${range}.csv`);
}
