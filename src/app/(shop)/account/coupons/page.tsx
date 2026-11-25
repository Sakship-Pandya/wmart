import { Suspense } from "react";
import Link from "next/link";
import { TicketPercent } from "lucide-react";
import { AccountEmptyState } from "@/components/shop/account/empty-state";
import { CopyCodeButton } from "@/components/shop/account/copy-code-button";
import { Skeleton } from "@/components/ui/skeleton";
import { couponProblem, couponSummary } from "@/lib/coupons";
import { requireCustomer } from "@/lib/customer-session";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Coupons" };

const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

// My account → Coupons: every coupon this customer can use right now, checked with the same
// rules as the cart (lib/coupons.ts) plus their own per-customer limit.
// Note: this lists ALL active coupons – there is no "private code" setting yet.
export default function CouponsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-40 rounded-2xl" />}>
      <CouponList />
    </Suspense>
  );
}

async function CouponList() {
  const customer = await requireCustomer("/account/coupons");
  const now = new Date();
  const coupons = await db.coupon.findMany({
    where: {
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
    },
    orderBy: [{ expiresAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
  });

  // This customer's uses per coupon (same count as checkout: by email, cancelled orders don't count).
  const uses = await db.order.groupBy({
    by: ["couponId"],
    where: { email: customer.email.toLowerCase(), couponId: { in: coupons.map((c) => c.id) }, status: { not: "CANCELLED" } },
    _count: { _all: true },
  });
  const usedByMe = new Map(uses.map((u) => [u.couponId, u._count._all]));

  const usable = coupons
    .filter((c) => couponProblem(c, Number.MAX_SAFE_INTEGER, now) === null) // active, started, not expired, not used up
    .map((c) => {
      const mine = usedByMe.get(c.id) ?? 0;
      const left = c.perCustomerLimit === null ? null : c.perCustomerLimit - mine;
      return { ...c, left };
    })
    .filter((c) => c.left === null || c.left > 0);

  if (usable.length === 0) return <AccountEmptyState message="You don't have any coupons right now." />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Copy a code and paste it in your cart to get the discount.</p>
      <ul className="grid gap-4 lg:grid-cols-2">
        {usable.map((c) => (
          <li key={c.id} className="flex flex-col gap-4 rounded-2xl border p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                <TicketPercent className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-lg font-bold text-heading">{couponSummary(c)}</p>
                <ul className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                  {c.minOrderValue ? <li>On orders of {formatPrice(c.minOrderValue)} or more</li> : <li>No minimum order</li>}
                  {c.expiresAt && <li>Valid until {dateFormat.format(c.expiresAt)}</li>}
                  {c.left !== null && <li>{c.left === 1 ? "You can use it once more" : `You can use it ${c.left} more times`}</li>}
                </ul>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg border border-dashed border-brand/60 bg-brand/5 px-3 py-1.5 font-mono text-base font-bold tracking-wider text-brand">
                {c.code}
              </span>
              <CopyCodeButton code={c.code} />
              <Link href="/cart" className="ml-auto text-sm font-medium text-brand hover:underline">
                Go to cart →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
