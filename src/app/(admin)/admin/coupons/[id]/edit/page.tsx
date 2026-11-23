import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/admin/shared/status-pill";
import { CouponForm } from "@/components/admin/coupons/coupon-form";
import { getAdminCoupon } from "@/server/queries/admin/coupons";
import { formatPrice } from "@/lib/format";
import { couponState, couponStateInfo, formatDateIST, formatOrderNumber, orderStatusInfo } from "@/lib/orders";

export const metadata = { title: "Edit coupon | WMart Admin" };

export default function EditCouponPage({ params }: PageProps<"/admin/coupons/[id]/edit">) {
  return (
    <Suspense fallback={<Skeleton className="h-[500px] max-w-3xl rounded-lg" />}>
      <EditCouponContent params={params} />
    </Suspense>
  );
}

async function EditCouponContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const coupon = await getAdminCoupon(id);
  if (!coupon) notFound();
  const state = couponState(coupon);
  const totalDiscount = coupon.orders.reduce((s, o) => s + o.discount, 0);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-2">
        <Link href="/admin/coupons" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Coupons
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-2xl font-bold tracking-tight">{coupon.code}</h1>
          <StatusPill tone={couponStateInfo[state].tone} label={couponStateInfo[state].label} />
        </div>
        <p className="text-sm text-muted-foreground">
          Used {coupon.usedCount} {coupon.usedCount === 1 ? "time" : "times"}
          {coupon.orders.length > 0 && <> · {formatPrice(totalDiscount)} discount given on the orders below</>}
        </p>
      </div>

      <CouponForm initial={coupon} />

      {coupon.orders.length > 0 && (
        <section className="rounded-lg border bg-card p-5">
          <h2 className="mb-3 font-semibold">
            Recent orders with this coupon{coupon._count.orders > coupon.orders.length && ` (latest ${coupon.orders.length} of ${coupon._count.orders})`}
          </h2>
          <ul className="divide-y text-sm">
            {coupon.orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <Link href={`/admin/orders/${o.id}`} className="font-semibold text-primary hover:underline">
                  {formatOrderNumber(o.orderNumber)}
                </Link>
                <span className="text-muted-foreground">{formatDateIST(o.createdAt)}</span>
                <span className="text-muted-foreground">{o.email}</span>
                <StatusPill tone={orderStatusInfo[o.status].tone} label={orderStatusInfo[o.status].label} />
                <span className="ml-auto">
                  −{formatPrice(o.discount)} · <span className="font-medium">{formatPrice(o.total)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
