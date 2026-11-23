import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma/client";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/generated/prisma/enums";
import { ORDER_STATUSES, PAYMENT_STATUSES, asAddress, parseOrderNumber } from "@/lib/orders";

export interface AdminOrderListParams {
  status?: string;
  payment?: string; // payment status
  method?: string; // PAYU | COD
  q?: string;
  page?: number;
  pageSize?: number;
}

function isOrderStatus(v: string | undefined): v is OrderStatus {
  return !!v && (ORDER_STATUSES as readonly string[]).includes(v);
}
function isPaymentStatus(v: string | undefined): v is PaymentStatus {
  return !!v && (PAYMENT_STATUSES as readonly string[]).includes(v);
}

/**
 * The Orders page filter, also used by the orders CSV export.
 * `withStatus: false` leaves out the status tab (used for the per-tab counts).
 */
export function buildAdminOrderWhere(
  params: AdminOrderListParams & { from?: Date; to?: Date },
  withStatus = true,
): Prisma.OrderWhereInput {
  const q = params.q?.trim();
  const orderNumber = q ? parseOrderNumber(q) : null;
  const base: Prisma.OrderWhereInput = {
    ...(params.from || params.to ? { createdAt: { ...(params.from ? { gte: params.from } : {}), ...(params.to ? { lt: params.to } : {}) } } : {}),
    ...(isPaymentStatus(params.payment) ? { paymentStatus: params.payment } : {}),
    ...(params.method === "PAYU" || params.method === "COD" ? { paymentMethod: params.method as PaymentMethod } : {}),
    ...(q
      ? {
          OR: [
            ...(orderNumber !== null ? [{ orderNumber }] : []),
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { customer: { is: { OR: [{ firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }] } } },
            { shipments: { some: { awb: { contains: q, mode: "insensitive" } } } },
            { invoiceNumber: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  return withStatus && isOrderStatus(params.status) ? { ...base, status: params.status } : base;
}

export async function getAdminOrders(params: AdminOrderListParams = {}) {
  await requireAdmin();
  const { page = 1, pageSize = 20 } = params;
  const base = buildAdminOrderWhere(params, false);
  const where = buildAdminOrderWhere(params);

  const safePage = Math.max(1, page);
  const [totalCount, rows, grouped] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        total: true,
        email: true,
        phone: true,
        shippingAddress: true,
        customerId: true,
        _count: { select: { items: true } },
        shipments: { select: { awb: true, status: true }, orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    // Counts per status for the tabs, with the same search/payment filters applied.
    db.order.groupBy({ by: ["status"], where: base, _count: { _all: true } }),
  ]);

  const statusCounts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
  for (const g of grouped) statusCounts[g.status] = g._count._all;
  const allCount = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  const orders = rows.map((o) => {
    const ship = asAddress(o.shippingAddress);
    return {
      ...o,
      customerName: ship?.fullName ?? o.email,
      city: ship ? `${ship.city}, ${ship.state}` : "",
      itemCount: o._count.items,
      shipment: o.shipments[0] ?? null,
    };
  });

  return {
    orders,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    currentPage: safePage,
    pageSize,
    statusCounts,
    allCount,
  };
}

export type AdminOrderRow = Awaited<ReturnType<typeof getAdminOrders>>["orders"][number];

export async function getAdminOrder(id: string) {
  await requireAdmin();
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { title: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      shipments: { orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "desc" } },
      customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, _count: { select: { orders: true } } } },
      coupon: { select: { id: true, code: true } },
    },
  });
  return order;
}

export type AdminOrderDetail = NonNullable<Awaited<ReturnType<typeof getAdminOrder>>>;
