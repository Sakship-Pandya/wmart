import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { couponState, type CouponState } from "@/lib/orders";

export async function getAdminCoupons(params: { q?: string; state?: string } = {}) {
  await requireAdmin();
  const q = params.q?.trim();
  const rows = await db.coupon.findMany({
    where: q ? { code: { contains: q, mode: "insensitive" } } : {},
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  const now = new Date();
  const all = rows.map((c) => ({ ...c, state: couponState(c, now), orderCount: c._count.orders }));
  const counts = all.reduce(
    (acc, c) => ((acc[c.state] = (acc[c.state] ?? 0) + 1), acc),
    {} as Partial<Record<CouponState, number>>,
  );
  const state = params.state as CouponState | undefined;
  return {
    coupons: state && state in counts ? all.filter((c) => c.state === state) : all,
    counts,
    total: all.length,
  };
}

export type AdminCouponRow = Awaited<ReturnType<typeof getAdminCoupons>>["coupons"][number];

export async function getAdminCoupon(id: string) {
  await requireAdmin();
  const coupon = await db.coupon.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, orderNumber: true, createdAt: true, email: true, discount: true, total: true, status: true },
      },
      _count: { select: { orders: true } },
    },
  });
  return coupon;
}
