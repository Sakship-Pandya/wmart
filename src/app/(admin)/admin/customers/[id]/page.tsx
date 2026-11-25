import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusPill } from "@/components/admin/shared/status-pill";
import { getAdminCustomer } from "@/server/queries/admin/customers";
import { formatPrice } from "@/lib/format";
import { formatDateIST, formatDateTimeIST, formatOrderNumber, orderStatusInfo, paymentStatusInfo } from "@/lib/orders";

export const metadata = { title: "Customer | WMart Admin" };

export default function AdminCustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[500px] rounded-lg" />}>
      <CustomerContent params={params} />
    </Suspense>
  );
}

async function CustomerContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getAdminCustomer(id);
  if (!customer) notFound();

  const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || customer.email;
  const stats = [
    { label: "Orders", value: String(customer.stats.orderCount) },
    { label: "Total spent", value: formatPrice(customer.stats.totalSpent) },
    { label: "Average order", value: customer.stats.averageOrder ? formatPrice(customer.stats.averageOrder) : "—" },
    { label: "Last order", value: customer.stats.lastOrderAt ? formatDateIST(customer.stats.lastOrderAt) : "—" },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link href="/admin/customers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Customers
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
          <StatusPill tone={customer.passwordHash ? "info" : "neutral"} label={customer.passwordHash ? "Registered" : "Guest checkout"} />
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <a href={`mailto:${customer.email}`} className="inline-flex items-center gap-1 hover:text-foreground">
            <Mail className="size-4" /> {customer.email}
          </a>
          {customer.phone && (
            <a href={`tel:+91${customer.phone}`} className="inline-flex items-center gap-1 hover:text-foreground">
              <Phone className="size-4" /> {customer.phone}
            </a>
          )}
          <span>Customer since {formatDateIST(customer.createdAt)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-lg font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Order</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Payment</TableHead>
                  <TableHead className="pr-4 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      No orders yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  customer.orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="pl-4">
                        <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand hover:underline">
                          {formatOrderNumber(o.orderNumber)}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {o._count.items} {o._count.items === 1 ? "item" : "items"}
                        </p>
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground sm:table-cell">{formatDateTimeIST(o.createdAt)}</TableCell>
                      <TableCell>
                        <StatusPill tone={orderStatusInfo[o.status].tone} label={orderStatusInfo[o.status].label} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <StatusPill tone={paymentStatusInfo[o.paymentStatus].tone} label={paymentStatusInfo[o.paymentStatus].label} />
                        <span className="ml-1.5 text-xs text-muted-foreground">{o.paymentMethod === "COD" ? "COD" : "PayU"}</span>
                      </TableCell>
                      <TableCell className="pr-4 text-right font-semibold">{formatPrice(o.total)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saved addresses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {customer.addresses.length === 0 && <p className="text-muted-foreground">No saved addresses.</p>}
            {customer.addresses.map((a) => (
              <div key={a.id}>
                <p className="text-xs font-medium text-muted-foreground">{a.type === "SHIPPING" ? "Shipping" : "Billing"}</p>
                <address className="not-italic">
                  {a.fullName}
                  <br />
                  {a.line1}
                  {a.line2 && (
                    <>
                      <br />
                      {a.line2}
                    </>
                  )}
                  <br />
                  {a.city}, {a.state} {a.pincode}
                  <br />
                  {a.phone}
                </address>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
