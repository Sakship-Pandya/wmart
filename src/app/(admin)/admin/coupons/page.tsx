import { Suspense } from "react";
import Link from "next/link";
import { Plus, TicketPercent } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ListFilters } from "@/components/admin/shared/list-filters";
import { StatusPill } from "@/components/admin/shared/status-pill";
import { CouponRowActions } from "@/components/admin/coupons/coupon-row-actions";
import { getAdminCoupons } from "@/server/queries/admin/coupons";
import { formatPrice } from "@/lib/format";
import { couponStateInfo, couponValueText, formatDateIST, type CouponState } from "@/lib/orders";
import { cn } from "@/lib/utils";

export const metadata = { title: "Coupons | WMart Admin" };

type SearchParams = Promise<{ q?: string; state?: string }>;
const STATES: CouponState[] = ["active", "scheduled", "expired", "used-up", "disabled"];

export default function AdminCouponsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <TicketPercent className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Coupons</h1>
          </div>
          <p className="text-sm text-muted-foreground">Discount codes customers can apply in the cart.</p>
        </div>
        <Link href="/admin/coupons/new" className={buttonVariants({ size: "sm" })}>
          <Plus className="mr-1.5 size-4" /> Add coupon
        </Link>
      </div>
      <Suspense fallback={<Skeleton className="h-80 rounded-lg" />}>
        <CouponsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CouponsContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { coupons, counts, total } = await getAdminCoupons(params);
  const active = params.state && STATES.includes(params.state as CouponState) ? params.state : "";

  const tabHref = (state: string) => {
    const p = new URLSearchParams();
    if (state) p.set("state", state);
    if (params.q) p.set("q", params.q);
    const qs = p.toString();
    return qs ? `/admin/coupons?${qs}` : "/admin/coupons";
  };
  const tabs = [{ value: "", label: "All", count: total }, ...STATES.map((s) => ({ value: s, label: couponStateInfo[s].label, count: counts[s] ?? 0 }))];

  return (
    <div className="space-y-4">
      <nav aria-label="Coupon state" className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <Link
            key={t.value || "all"}
            href={tabHref(t.value)}
            aria-current={active === t.value ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              active === t.value ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
            )}
          >
            {t.label} <span className={cn("ml-1", active === t.value ? "opacity-80" : "text-muted-foreground")}>{t.count}</span>
          </Link>
        ))}
      </nav>

      <ListFilters placeholder="Search by coupon code" keep={["state"]} />

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Conditions</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Valid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  No coupons here yet.{" "}
                  <Link href="/admin/coupons/new" className="text-primary hover:underline">Create one</Link>
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/admin/coupons/${c.id}/edit`} className="font-mono font-semibold text-primary hover:underline">
                      {c.code}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">{couponValueText(c.type, c.value)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.minOrderValue ? <p>Min. order {formatPrice(c.minOrderValue)}</p> : null}
                    {c.maxDiscount ? <p>Max. {formatPrice(c.maxDiscount)} off</p> : null}
                    {c.perCustomerLimit ? <p>{c.perCustomerLimit} per customer</p> : null}
                    {!c.minOrderValue && !c.maxDiscount && !c.perCustomerLimit && "None"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {c.usedCount}
                    <span className="text-muted-foreground"> / {c.usageLimit ?? "∞"}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {c.startsAt || c.expiresAt ? (
                      <>
                        {c.startsAt ? formatDateIST(c.startsAt) : "Now"} – {c.expiresAt ? formatDateIST(c.expiresAt) : "No expiry"}
                      </>
                    ) : (
                      "No end date"
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusPill tone={couponStateInfo[c.state].tone} label={couponStateInfo[c.state].label} />
                  </TableCell>
                  <TableCell>
                    <CouponRowActions id={c.id} code={c.code} isActive={c.isActive} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
