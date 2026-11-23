import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma/client";
import { needsRestockWhere } from "@/lib/inventory";

const DAY = 24 * 60 * 60 * 1000;
const IST_OFFSET = 5.5 * 60 * 60 * 1000;

/** Orders that count as sales: not cancelled, not returned, payment not failed. */
const salesWhere: Prisma.OrderWhereInput = {
  status: { notIn: ["CANCELLED", "RETURNED"] },
  paymentStatus: { not: "FAILED" },
};

/** Midnight IST of the day `daysAgo` days before today, as a UTC Date. */
function istMidnight(daysAgo = 0): Date {
  const istNow = new Date(Date.now() + IST_OFFSET);
  const midnightIstAsUtc = Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate());
  return new Date(midnightIstAsUtc - IST_OFFSET - daysAgo * DAY);
}

/** "YYYY-MM-DD" of a date in IST. */
function istDay(d: Date): string {
  return new Date(d.getTime() + IST_OFFSET).toISOString().slice(0, 10);
}

async function salesBetween(from: Date, to?: Date) {
  const r = await db.order.aggregate({
    where: { ...salesWhere, createdAt: { gte: from, ...(to ? { lt: to } : {}) } },
    _sum: { total: true },
    _count: { _all: true },
  });
  return { revenue: r._sum.total ?? 0, orders: r._count._all };
}

/** Badge counts for the admin sidebar. Cheap: two counts. */
export async function getAdminNavCounts() {
  const [ordersToProcess, needsRestock] = await Promise.all([
    db.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PACKED"] }, paymentStatus: { not: "FAILED" } } }),
    db.product.count({ where: needsRestockWhere }),
  ]);
  return { ordersToProcess, needsRestock };
}

export async function getAdminSalesDashboard() {
  await requireAdmin();

  const today = istMidnight(0);
  const yesterday = istMidnight(1);
  const d7 = istMidnight(6); // today + previous 6 days
  const d14 = istMidnight(13);
  const d30 = istMidnight(29);
  const d60 = istMidnight(59);

  const [
    todaySales,
    yesterdaySales,
    week,
    month,
    prevMonth,
    codToConfirm,
    payuUnpaid,
    toPack,
    toShip,
    inTransit,
    codCash,
    chartOrders,
    recentOrders,
    topItems,
    paymentMix,
    customersTotal,
    customersNew,
  ] = await Promise.all([
    salesBetween(today),
    salesBetween(yesterday, today),
    salesBetween(d7),
    salesBetween(d30),
    salesBetween(d60, d30),
    db.order.count({ where: { status: "PENDING", paymentMethod: "COD" } }),
    db.order.count({ where: { status: "PENDING", paymentMethod: "PAYU", paymentStatus: { in: ["PENDING", "FAILED"] } } }),
    db.order.count({ where: { status: "CONFIRMED" } }),
    db.order.count({ where: { status: "PACKED" } }),
    db.order.count({ where: { status: "SHIPPED" } }),
    // Delivered COD orders whose cash hasn't been received from Delhivery yet.
    db.order.aggregate({
      where: { status: "DELIVERED", paymentMethod: "COD", paymentStatus: "PENDING" },
      _sum: { total: true },
      _count: { _all: true },
    }),
    db.order.findMany({ where: { ...salesWhere, createdAt: { gte: d14 } }, select: { createdAt: true, total: true } }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, orderNumber: true, createdAt: true, status: true, paymentMethod: true, paymentStatus: true, total: true, shippingAddress: true, email: true },
    }),
    db.orderItem.groupBy({
      by: ["productId"],
      where: { productId: { not: null }, order: { ...salesWhere, createdAt: { gte: d30 } } },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { lineTotal: "desc" } },
      take: 5,
    }),
    db.order.groupBy({ by: ["paymentMethod"], where: { ...salesWhere, createdAt: { gte: d30 } }, _count: { _all: true }, _sum: { total: true } }),
    db.customer.count(),
    db.customer.count({ where: { createdAt: { gte: d30 } } }),
  ]);

  // 14 daily buckets (IST), oldest first, including days with no sales.
  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (let i = 13; i >= 0; i--) byDay.set(istDay(istMidnight(i)), { revenue: 0, orders: 0 });
  for (const o of chartOrders) {
    const bucket = byDay.get(istDay(o.createdAt));
    if (bucket) {
      bucket.revenue += o.total;
      bucket.orders += 1;
    }
  }
  const daily = [...byDay.entries()].map(([day, v]) => ({ day, ...v }));

  const topProducts = topItems.length
    ? await db.product.findMany({
        where: { id: { in: topItems.map((t) => t.productId!) } },
        select: { id: true, title: true, stock: true, images: { take: 1, orderBy: { position: "asc" }, select: { url: true } } },
      })
    : [];
  const productById = new Map(topProducts.map((p) => [p.id, p]));

  const change = (now: number, before: number) => (before > 0 ? Math.round(((now - before) / before) * 100) : null);

  return {
    sales: {
      today: { ...todaySales, changeVsYesterday: change(todaySales.revenue, yesterdaySales.revenue), yesterdayRevenue: yesterdaySales.revenue },
      week,
      month: { ...month, changeVsPrevious: change(month.revenue, prevMonth.revenue) },
      averageOrder: month.orders ? Math.round(month.revenue / month.orders) : 0,
    },
    actions: {
      codToConfirm,
      payuUnpaid,
      toPack,
      toShip,
      inTransit,
      codCashPending: { orders: codCash._count._all, amount: codCash._sum.total ?? 0 },
    },
    daily,
    recentOrders,
    topProducts: topItems
      .map((t) => ({ product: productById.get(t.productId!), quantity: t._sum.quantity ?? 0, revenue: t._sum.lineTotal ?? 0 }))
      .filter((t) => t.product),
    paymentMix: paymentMix.map((p) => ({ method: p.paymentMethod, orders: p._count._all, revenue: p._sum.total ?? 0 })),
    customers: { total: customersTotal, newLast30: customersNew },
  };
}
