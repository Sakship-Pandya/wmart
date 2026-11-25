import { Suspense } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ListFilters } from "@/components/admin/shared/list-filters";
import { ListPagination } from "@/components/admin/shared/list-pagination";
import { StatusPill } from "@/components/admin/shared/status-pill";
import { OrdersExport } from "@/components/admin/orders/orders-export";
import { getAdminOrders } from "@/server/queries/admin/orders";
import { formatPrice } from "@/lib/format";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  formatDateTimeIST,
  formatOrderNumber,
  orderStatusInfo,
  paymentMethodLabel,
  paymentStatusInfo,
  shipmentStatusLabel,
} from "@/lib/orders";
import { cn } from "@/lib/utils";

export const metadata = { title: "Orders | WMart Admin" };

type SearchParams = Promise<{ status?: string; payment?: string; method?: string; q?: string; page?: string }>;

export default function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-6 text-brand" />
            <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Confirm, pack and ship orders, record Delhivery AWB numbers and payments.
          </p>
        </div>
        <Suspense fallback={null}>
          <OrdersExport />
        </Suspense>
      </div>
      <Suspense fallback={<Skeleton className="h-96 rounded-lg" />}>
        <OrdersContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function OrdersContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Number.parseInt(params.page ?? "1", 10);
  const data = await getAdminOrders({ ...params, page: Number.isNaN(page) ? 1 : page, pageSize: 20 });
  const activeStatus = params.status && (ORDER_STATUSES as readonly string[]).includes(params.status) ? params.status : "";

  // Tab links keep the search and payment filters.
  const tabHref = (status: string) => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (params.q) p.set("q", params.q);
    if (params.payment) p.set("payment", params.payment);
    if (params.method) p.set("method", params.method);
    const qs = p.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  };
  const tabs = [{ value: "", label: "All", count: data.allCount }, ...ORDER_STATUSES.map((s) => ({ value: s, label: orderStatusInfo[s].label, count: data.statusCounts[s] }))];

  return (
    <div className="space-y-4">
      <nav aria-label="Order status" className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <Link
            key={t.value || "all"}
            href={tabHref(t.value)}
            aria-current={activeStatus === t.value ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              activeStatus === t.value ? "border-heading bg-heading text-background" : "bg-card hover:bg-muted",
            )}
          >
            {t.label} <span className={cn("ml-1", activeStatus === t.value ? "opacity-80" : "text-muted-foreground")}>{t.count}</span>
          </Link>
        ))}
      </nav>

      <ListFilters
        placeholder="Search by order no. (WM10234), name, email, phone, AWB or invoice no."
        keep={["status"]}
        selects={[
          {
            param: "method",
            label: "Payment method",
            options: [
              { value: "", label: "All payment methods" },
              { value: "PAYU", label: paymentMethodLabel.PAYU },
              { value: "COD", label: paymentMethodLabel.COD },
            ],
          },
          {
            param: "payment",
            label: "Payment status",
            options: [{ value: "", label: "Any payment status" }, ...PAYMENT_STATUSES.map((s) => ({ value: s, label: paymentStatusInfo[s].label }))],
          },
        ]}
      />

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead className="hidden lg:table-cell">Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden lg:table-cell">Payment</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden xl:table-cell">Shipment</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  No orders match these filters.
                </TableCell>
              </TableRow>
            ) : (
              data.orders.map((o) => (
                <TableRow key={o.id} className="group">
                  <TableCell className="whitespace-normal">
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand hover:underline">
                      {formatOrderNumber(o.orderNumber)}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {o.itemCount} {o.itemCount === 1 ? "item" : "items"}
                    </p>
                    <p className="text-xs text-muted-foreground lg:hidden">{formatDateTimeIST(o.createdAt)}</p>
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground lg:table-cell">{formatDateTimeIST(o.createdAt)}</TableCell>
                  <TableCell className="whitespace-normal">
                    <p className="max-w-[14rem] font-medium [overflow-wrap:anywhere]">{o.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.city}
                      {!o.customerId && " · Guest"}
                    </p>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <StatusPill tone={paymentStatusInfo[o.paymentStatus].tone} label={paymentStatusInfo[o.paymentStatus].label} />
                    <p className="mt-1 text-xs text-muted-foreground">{o.paymentMethod === "COD" ? "COD" : "PayU"}</p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <StatusPill tone={orderStatusInfo[o.status].tone} label={orderStatusInfo[o.status].label} />
                  </TableCell>
                  <TableCell className="hidden text-xs xl:table-cell">
                    {o.shipment ? (
                      <>
                        <p>{shipmentStatusLabel[o.shipment.status]}</p>
                        {o.shipment.awb && <p className="font-mono text-muted-foreground">{o.shipment.awb}</p>}
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-normal text-right">
                    <p className="whitespace-nowrap font-semibold">{formatPrice(o.total)}</p>
                    {/* Phones/tablets: status and payment, since those columns are hidden there. */}
                    <div className="mt-1 flex flex-col items-end gap-1 lg:hidden">
                      <StatusPill tone={orderStatusInfo[o.status].tone} label={orderStatusInfo[o.status].label} className="sm:hidden" />
                      <span className="text-xs text-muted-foreground">
                        {o.paymentMethod === "COD" ? "COD" : "PayU"} · {paymentStatusInfo[o.paymentStatus].label}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ListPagination currentPage={data.currentPage} totalPages={data.totalPages} totalCount={data.totalCount} pageSize={data.pageSize} noun="orders" />
    </div>
  );
}
