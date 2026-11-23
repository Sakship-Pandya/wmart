import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CheckCircle2,
  Download,
  IndianRupee,
  Package,
  PackageCheck,
  Phone,
  Plus,
  ShoppingBag,
  Truck,
  Upload,
  Users,
  CreditCard,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/admin/shared/status-pill";
import { RevenueChart } from "@/components/admin/dashboard/revenue-chart";
import { getAdminSalesDashboard } from "@/server/queries/admin/dashboard";
import { getAdminDashboardSummary } from "@/server/queries/admin/products";
import { formatPrice } from "@/lib/format";
import { shortenText } from "@/lib/text";
import { asAddress, formatDateTimeIST, formatOrderNumber, orderStatusInfo, paymentStatusInfo } from "@/lib/orders";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Dashboard | WMart Admin",
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Sales, orders that need you, and stock alerts. Times in IST.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/import" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Upload className="mr-1.5 size-4" />
            Bulk import
          </Link>
          <Link href="/admin/products/new" className={buttonVariants({ size: "sm" })}>
            <Plus className="mr-1.5 size-4" />
            Add product
          </Link>
        </div>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  const [d, catalogue] = await Promise.all([getAdminSalesDashboard(), getAdminDashboardSummary()]);
  const { sales, actions } = d;
  const m = catalogue.metrics;

  const attention = [
    { label: "COD to confirm", value: actions.codToConfirm, hint: "Call / WhatsApp the customer", href: "/admin/orders?status=PENDING&method=COD", icon: Phone },
    { label: "PayU not paid", value: actions.payuUnpaid, hint: "Pending or failed payment", href: "/admin/orders?status=PENDING&method=PAYU", icon: CreditCard },
    { label: "To pack", value: actions.toPack, hint: "Confirmed orders", href: "/admin/orders?status=CONFIRMED", icon: Package },
    { label: "To ship", value: actions.toShip, hint: "Packed, book Delhivery", href: "/admin/orders?status=PACKED", icon: PackageCheck },
    { label: "In transit", value: actions.inTransit, hint: "With Delhivery", href: "/admin/orders?status=SHIPPED", icon: Truck },
    {
      label: "COD cash due",
      value: actions.codCashPending.orders,
      hint: actions.codCashPending.amount ? `${formatPrice(actions.codCashPending.amount)} from Delhivery` : "Nothing due",
      href: "/admin/orders?status=DELIVERED&method=COD&payment=PENDING",
      icon: Banknote,
    },
  ];
  const mixTotal = d.paymentMix.reduce((s, p) => s + p.orders, 0);

  return (
    <div className="space-y-6">
      {/* Sales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today"
          icon={IndianRupee}
          value={formatPrice(sales.today.revenue)}
          sub={`${sales.today.orders} ${sales.today.orders === 1 ? "order" : "orders"} · yesterday ${formatPrice(sales.today.yesterdayRevenue)}`}
          change={sales.today.changeVsYesterday}
          changeLabel="vs yesterday"
        />
        <StatCard title="Last 7 days" icon={ShoppingBag} value={formatPrice(sales.week.revenue)} sub={`${sales.week.orders} orders`} />
        <StatCard
          title="Last 30 days"
          icon={TrendingUp}
          value={formatPrice(sales.month.revenue)}
          sub={`${sales.month.orders} orders`}
          change={sales.month.changeVsPrevious}
          changeLabel="vs previous 30 days"
        />
        <StatCard
          title="Average order"
          icon={Users}
          value={sales.averageOrder ? formatPrice(sales.averageOrder) : "—"}
          sub={`${d.customers.total} customers · ${d.customers.newLast30} new in 30 days`}
        />
      </div>

      {/* Needs attention */}
      <section aria-labelledby="attention-heading" className="space-y-2">
        <h2 id="attention-heading" className="text-sm font-semibold">Needs attention</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {attention.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className={cn(
                "rounded-lg border bg-card p-3 transition-colors hover:bg-muted",
                a.value > 0 && "border-primary/40",
              )}
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{a.label}</span>
                <a.icon className="size-4" />
              </div>
              <p className={cn("mt-1 text-2xl font-bold", a.value === 0 && "text-muted-foreground")}>{a.value}</p>
              <p className="truncate text-[11px] text-muted-foreground">{a.hint}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Chart + top products */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue, last 14 days</CardTitle>
            <CardDescription>Paid and pending orders; cancelled, returned and failed payments excluded.</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart daily={d.daily} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top products, 30 days</CardTitle>
            <CardDescription>By revenue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {d.topProducts.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No sales in the last 30 days.</p>
            ) : (
              <ol className="space-y-3">
                {d.topProducts.map((t, i) => (
                  <li key={t.product!.id} className="flex items-center gap-3">
                    <span className="w-4 text-xs text-muted-foreground">{i + 1}</span>
                    <div className="relative size-9 shrink-0 overflow-hidden rounded border bg-muted">
                      {t.product!.images[0] && <Image src={t.product!.images[0].url} alt="" fill sizes="36px" className="object-contain p-0.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/products/${t.product!.id}/edit`} title={t.product!.title} className="line-clamp-1 text-sm font-medium hover:underline">
                        {shortenText(t.product!.title)}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {t.quantity} sold · {t.product!.stock} in stock
                      </p>
                    </div>
                    <span className="text-sm font-semibold">{formatPrice(t.revenue)}</span>
                  </li>
                ))}
              </ol>
            )}

            {mixTotal > 0 && (
              <div className="border-t pt-3">
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Payment method, 30 days</p>
                {d.paymentMix.map((p) => (
                  <div key={p.method} className="flex justify-between text-xs">
                    <span>{p.method === "COD" ? "Cash on Delivery" : "PayU (online)"}</span>
                    <span>
                      {p.orders} orders ({Math.round((p.orders / mixTotal) * 100)}%) · {formatPrice(p.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent orders + stock alerts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent orders</CardTitle>
              <CardDescription>Latest 6</CardDescription>
            </div>
            <Link href="/admin/orders" className="flex items-center gap-1 text-xs text-primary hover:underline">
              All orders <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {d.recentOrders.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No orders yet.</p>
            ) : (
              <ul className="divide-y text-sm">
                {d.recentOrders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <Link href={`/admin/orders/${o.id}`} className="font-semibold text-primary hover:underline">
                        {formatOrderNumber(o.orderNumber)}
                      </Link>
                      <span className="ml-2 text-muted-foreground">{asAddress(o.shippingAddress)?.fullName ?? o.email}</span>
                      <p className="text-xs text-muted-foreground">{formatDateTimeIST(o.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="font-semibold">{formatPrice(o.total)}</span>
                      <div className="flex gap-1">
                        <StatusPill tone={orderStatusInfo[o.status].tone} label={orderStatusInfo[o.status].label} />
                        <StatusPill tone={paymentStatusInfo[o.paymentStatus].tone} label={o.paymentMethod === "COD" ? `COD · ${paymentStatusInfo[o.paymentStatus].label}` : paymentStatusInfo[o.paymentStatus].label} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="size-4 text-amber-500" />
                Stock alerts
              </CardTitle>
              <CardDescription>
                {m.outOfStockProducts} out of stock · {m.lowStockCount} low (1–{m.lowStockThreshold} left)
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Link href="/admin/products?status=needs-restock" className="flex items-center gap-1 text-xs text-primary hover:underline">
                View all <ArrowRight className="size-3" />
              </Link>
              <a href="/api/admin/export/products?status=needs-restock" className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Download className="size-3" /> Restock list (CSV)
              </a>
            </div>
          </CardHeader>
          <CardContent>
            {catalogue.lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <CheckCircle2 className="mx-auto mb-2 size-6 text-emerald-600" />
                All active products have more than {m.lowStockThreshold} units in stock.
              </div>
            ) : (
              <ul className="divide-y text-sm">
                {catalogue.lowStockProducts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/products/${p.id}/edit`} title={p.title} className="block truncate font-medium hover:underline">
                        {shortenText(p.title)}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {p.brand.name} · {p.category.name}
                      </p>
                    </div>
                    {p.stock <= 0 ? <StatusPill tone="danger" label="Out of stock" /> : <StatusPill tone="warning" label={`${p.stock} left`} />}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Catalogue */}
      <div className="flex flex-wrap gap-3 text-xs">
        <Link href="/admin/products" className="rounded-md border bg-card px-3 py-1.5 hover:bg-muted">
          <span className="text-muted-foreground">Products:</span> <span className="font-semibold">{m.totalProducts}</span>
        </Link>
        <Link href="/admin/products?status=active" className="rounded-md border bg-card px-3 py-1.5 hover:bg-muted">
          <span className="text-muted-foreground">Active:</span> <span className="font-semibold text-emerald-600">{m.activeProducts}</span>
        </Link>
        <Link href="/admin/brands" className="rounded-md border bg-card px-3 py-1.5 hover:bg-muted">
          <span className="text-muted-foreground">Brands:</span> <span className="font-semibold">{m.totalBrands}</span>
        </Link>
        <Link href="/admin/categories" className="rounded-md border bg-card px-3 py-1.5 hover:bg-muted">
          <span className="text-muted-foreground">Categories:</span> <span className="font-semibold">{m.totalCategories}</span>
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  title,
  icon: Icon,
  value,
  sub,
  change,
  changeLabel,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  sub: string;
  change?: number | null;
  changeLabel?: string;
}) {
  const up = (change ?? 0) >= 0;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
        {change !== undefined && change !== null && (
          <p className={cn("mt-1 flex items-center gap-1 text-xs font-medium", up ? "text-emerald-600" : "text-red-600")}>
            {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {up ? "+" : ""}
            {change}% {changeLabel}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
