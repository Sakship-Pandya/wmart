import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma/client";

export interface AdminCustomerListParams {
  q?: string;
  sort?: string; // newest | oldest | spent | orders | name
  page?: number;
  pageSize?: number;
}

/** Orders that count towards "total spent": not cancelled, not returned, not failed. */
const countedOrder: Prisma.OrderWhereInput = {
  status: { notIn: ["CANCELLED", "RETURNED"] },
  paymentStatus: { not: "FAILED" },
};

/**
 * Every customer matching the Customers page search, with order totals, sorted.
 * Shared by the Customers page (which paginates it) and the customers CSV export.
 * No login check here: callers must check (getAdminCustomers / the export route).
 * `from`/`to` filter by the date the customer joined.
 */
export async function listAdminCustomerRows(params: { q?: string; sort?: string; from?: Date; to?: Date } = {}) {
  const { sort = "newest" } = params;
  const q = params.q?.trim();

  const where: Prisma.CustomerWhereInput = {
    ...(params.from || params.to ? { createdAt: { ...(params.from ? { gte: params.from } : {}), ...(params.to ? { lt: params.to } : {}) } } : {}),
    ...(q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { addresses: { some: { OR: [{ city: { contains: q, mode: "insensitive" } }, { pincode: { contains: q } }] } } },
        ],
      }
    : {}),
  };

  // Totals are computed in the database for every matching customer, then sorted
  // and paginated in memory. Fine for thousands of customers; revisit beyond that.
  const customers = await db.customer.findMany({
    where,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      createdAt: true,
      passwordHash: true,
      addresses: { where: { type: "SHIPPING" }, select: { city: true, state: true }, take: 1 },
    },
  });
  const ids = customers.map((c) => c.id);
  const [spent, orderCounts] = ids.length
    ? await Promise.all([
        db.order.groupBy({ by: ["customerId"], where: { customerId: { in: ids }, ...countedOrder }, _sum: { total: true }, _max: { createdAt: true } }),
        db.order.groupBy({ by: ["customerId"], where: { customerId: { in: ids } }, _count: { _all: true }, _max: { createdAt: true } }),
      ])
    : [[], []];
  const spentBy = new Map(spent.map((s) => [s.customerId, s._sum.total ?? 0]));
  const countBy = new Map(orderCounts.map((s) => [s.customerId, { count: s._count._all, last: s._max.createdAt }]));

  const rows = customers.map((c) => ({
    id: c.id,
    email: c.email,
    name: [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email,
    phone: c.phone,
    createdAt: c.createdAt,
    hasAccount: c.passwordHash !== null,
    location: c.addresses[0] ? `${c.addresses[0].city}, ${c.addresses[0].state}` : "",
    orderCount: countBy.get(c.id)?.count ?? 0,
    lastOrderAt: countBy.get(c.id)?.last ?? null,
    totalSpent: spentBy.get(c.id) ?? 0,
  }));

  const sorters: Record<string, (a: (typeof rows)[number], b: (typeof rows)[number]) => number> = {
    newest: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    oldest: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    spent: (a, b) => b.totalSpent - a.totalSpent,
    orders: (a, b) => b.orderCount - a.orderCount,
    name: (a, b) => a.name.localeCompare(b.name),
  };
  rows.sort(sorters[sort] ?? sorters.newest);
  return rows;
}

export async function getAdminCustomers(params: AdminCustomerListParams = {}) {
  await requireAdmin();
  const { page = 1, pageSize = 20 } = params;
  const rows = await listAdminCustomerRows(params);

  const totalCount = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  return {
    customers: rows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    totalCount,
    totalPages,
    currentPage,
    pageSize,
  };
}

export type AdminCustomerRow = Awaited<ReturnType<typeof getAdminCustomers>>["customers"][number];

export async function getAdminCustomer(id: string) {
  await requireAdmin();
  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      addresses: { orderBy: { type: "asc" } },
      orders: {
        orderBy: { createdAt: "desc" },
        select: { id: true, orderNumber: true, createdAt: true, status: true, paymentStatus: true, paymentMethod: true, total: true, _count: { select: { items: true } } },
      },
    },
  });
  if (!customer) return null;

  const counted = customer.orders.filter((o) => !["CANCELLED", "RETURNED"].includes(o.status) && o.paymentStatus !== "FAILED");
  const totalSpent = counted.reduce((s, o) => s + o.total, 0);
  return {
    ...customer,
    stats: {
      orderCount: customer.orders.length,
      totalSpent,
      averageOrder: counted.length ? Math.round(totalSpent / counted.length) : 0,
      lastOrderAt: customer.orders[0]?.createdAt ?? null,
    },
  };
}

export type AdminCustomerDetail = NonNullable<Awaited<ReturnType<typeof getAdminCustomer>>>;
