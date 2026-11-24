// Customers CSV export (admin only).
//   GET /api/admin/export/customers?q=&sort=&from=YYYY-MM-DD&to=YYYY-MM-DD
// Same search and sort as the admin Customers page. from/to filter by the date the
// customer joined (IST days, both inclusive). One row per customer, with order totals
// and the saved shipping and billing addresses.
// Contains personal data: only for admins, and handle the file carefully.
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { listAdminCustomerRows } from "@/server/queries/admin/customers";
import { csvResponse, istDateRange, rupees, toCsv, todayIST } from "@/lib/csv";
import { formatDateTimeIST } from "@/lib/orders";

const ADDRESS_FIELDS = ["full_name", "phone", "line1", "line2", "city", "state", "pincode"] as const;

const COLUMNS = [
  "name",
  "email",
  "phone",
  "account",
  "joined_ist",
  "orders",
  "total_spent",
  "average_order",
  "last_order_ist",
  ...ADDRESS_FIELDS.map((f) => `shipping_${f}` as const),
  ...ADDRESS_FIELDS.map((f) => `billing_${f}` as const),
] as const;

export async function GET(request: Request) {
  if (!(await getAdminSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const p = new URL(request.url).searchParams;
  const { from, to } = istDateRange(p);
  const rows = await listAdminCustomerRows({ q: p.get("q") ?? undefined, sort: p.get("sort") ?? undefined, from, to });

  // Saved addresses and the number of "counted" orders (for the average).
  const ids = rows.map((r) => r.id);
  const [addresses, counted] = ids.length
    ? await Promise.all([
        db.address.findMany({ where: { customerId: { in: ids } } }),
        db.order.groupBy({
          by: ["customerId"],
          where: { customerId: { in: ids }, status: { notIn: ["CANCELLED", "RETURNED"] }, paymentStatus: { not: "FAILED" } },
          _count: { _all: true },
        }),
      ])
    : [[], []];
  const addressOf = new Map(addresses.map((a) => [`${a.customerId}:${a.type}`, a]));
  const countedOf = new Map(counted.map((c) => [c.customerId, c._count._all]));

  const addressCols = (prefix: "shipping" | "billing", a: (typeof addresses)[number] | undefined) =>
    Object.fromEntries(
      ADDRESS_FIELDS.map((f) => {
        const value = !a ? "" : f === "full_name" ? a.fullName : f === "line2" ? (a.line2 ?? "") : a[f];
        return [`${prefix}_${f}`, value];
      }),
    );

  const out: Record<string, unknown>[] = rows.map((r) => {
    const n = countedOf.get(r.id) ?? 0;
    return {
      name: r.name,
      email: r.email,
      phone: r.phone ?? "",
      account: r.hasAccount ? "Registered" : "Guest checkout",
      joined_ist: formatDateTimeIST(r.createdAt),
      orders: r.orderCount,
      total_spent: rupees(r.totalSpent),
      average_order: n ? rupees(Math.round(r.totalSpent / n)) : "",
      last_order_ist: r.lastOrderAt ? formatDateTimeIST(r.lastOrderAt) : "",
      ...addressCols("shipping", addressOf.get(`${r.id}:SHIPPING`)),
      ...addressCols("billing", addressOf.get(`${r.id}:BILLING`)),
    };
  });

  const range = p.get("from") || p.get("to") ? `-joined-${p.get("from") ?? "start"}_to_${p.get("to") ?? todayIST()}` : `-${todayIST()}`;
  return csvResponse(toCsv<Record<string, unknown>>([...COLUMNS], out), `wmart-customers${range}.csv`);
}
