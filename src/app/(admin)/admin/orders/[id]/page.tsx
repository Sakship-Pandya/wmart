import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { GenerateInvoiceButton } from "@/components/admin/orders/invoice-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/admin/shared/status-pill";
import { OrderNoteForm, OrderStatusForm, PaymentStatusForm, ShipmentForm } from "@/components/admin/orders/order-actions";
import { getAdminOrder, type AdminOrderDetail } from "@/server/queries/admin/orders";
import { formatPrice } from "@/lib/format";
import { shortenText } from "@/lib/text";
import { delhiveryAwbUrl } from "@/lib/site";
import {
  allowedNextStatuses,
  asAddress,
  formatDateTimeIST,
  formatOrderNumber,
  orderGstSplit,
  orderStatusInfo,
  paymentMethodLabel,
  paymentStatusInfo,
  shipmentStatusLabel,
  type AddressSnapshot,
} from "@/lib/orders";

export const metadata = { title: "Order | WMart Admin" };

export default function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[600px] rounded-lg" />}>
      <OrderContent params={params} />
    </Suspense>
  );
}

async function OrderContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const shipping = asAddress(order.shippingAddress);
  const billing = asAddress(order.billingAddress);
  const shipment = order.shipments[0] ?? null;
  const payment = order.payments[0] ?? null;
  const sameAddress = JSON.stringify(shipping) === JSON.stringify(billing);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Orders
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Order {formatOrderNumber(order.orderNumber)}</h1>
          <StatusPill tone={orderStatusInfo[order.status].tone} label={orderStatusInfo[order.status].label} />
          <StatusPill tone={paymentStatusInfo[order.paymentStatus].tone} label={paymentStatusInfo[order.paymentStatus].label} />
          <div className="ml-auto">
            {order.invoiceNumber ? (
              <Link href={`/admin/orders/${order.id}/invoice`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                <FileText className="mr-1.5 size-4" />
                Invoice {order.invoiceNumber}
              </Link>
            ) : (
              order.status !== "PENDING" && order.status !== "CANCELLED" && <GenerateInvoiceButton orderId={order.id} />
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Placed {formatDateTimeIST(order.createdAt)} · {paymentMethodLabel[order.paymentMethod]}
          {order.invoiceNumber && <> · Invoice {order.invoiceNumber}</>}
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left: items, totals, timeline */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="divide-y">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-md border bg-muted">
                      {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-contain p-1" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      {item.productId ? (
                        <Link href={`/admin/products/${item.productId}/edit`} title={item.title} className="line-clamp-2 text-sm font-medium hover:underline [overflow-wrap:anywhere]">
                          {shortenText(item.title)}
                        </Link>
                      ) : (
                        <p title={item.title} className="line-clamp-2 text-sm font-medium [overflow-wrap:anywhere]">{shortenText(item.title)} <span className="text-muted-foreground">(deleted)</span></p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.unitPrice)} × {item.quantity}
                        {item.hsnCode && <> · HSN {item.hsnCode}</>} · GST {item.gstRate}%
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{formatPrice(item.lineTotal)}</p>
                  </li>
                ))}
              </ul>
              <Totals order={order} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <OrderNoteForm orderId={order.id} />
              <ol className="space-y-4 border-l pl-4">
                {order.events.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full border-2 border-background bg-primary" />
                    <p className="text-sm font-medium">{eventTitle(e.type)}</p>
                    {e.message && <p className="text-sm text-muted-foreground">{e.message}</p>}
                    <p className="text-xs text-muted-foreground">
                      {formatDateTimeIST(e.createdAt)} · {e.actor.replace(/^admin:/, "")}
                    </p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Right: actions and customer */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order status</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusForm orderId={order.id} nextStatuses={allowedNextStatuses[order.status]} />
              {order.cancelReason && <p className="mt-3 text-sm text-muted-foreground">Cancelled: {order.cancelReason}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>{paymentMethodLabel[order.paymentMethod]}</p>
              {payment && (
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                  <dt className="text-muted-foreground">Txn ID</dt>
                  <dd className="truncate font-mono">{payment.txnId}</dd>
                  {payment.gatewayPaymentId && (
                    <>
                      <dt className="text-muted-foreground">PayU ID</dt>
                      <dd className="font-mono">{payment.gatewayPaymentId}</dd>
                    </>
                  )}
                  {payment.refundedAmount > 0 && (
                    <>
                      <dt className="text-muted-foreground">Refunded</dt>
                      <dd>{formatPrice(payment.refundedAmount)}</dd>
                    </>
                  )}
                </dl>
              )}
              <PaymentStatusForm orderId={order.id} current={order.paymentStatus} />
              {order.paymentMethod === "COD" && order.paymentStatus === "PENDING" && (
                <p className="text-xs text-muted-foreground">Mark as Paid once Delhivery remits the cash.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {shipment && (
                <div className="space-y-1">
                  <p>
                    {shipment.courier}: <span className="font-medium">{shipmentStatusLabel[shipment.status]}</span>
                  </p>
                  {shipment.lastUpdate && <p className="text-xs text-muted-foreground">{shipment.lastUpdate}</p>}
                  {shipment.codAmount > 0 && <p className="text-xs">Collect on delivery: {formatPrice(shipment.codAmount)}</p>}
                  {shipment.awb && (
                    <a href={delhiveryAwbUrl(shipment.awb)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      Track on Delhivery <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              )}
              <ShipmentForm orderId={order.id} awb={shipment?.awb ?? null} status={shipment?.status ?? null} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                {order.customer ? (
                  <Link href={`/admin/customers/${order.customer.id}`} className="font-medium text-primary hover:underline">
                    {[order.customer.firstName, order.customer.lastName].filter(Boolean).join(" ") || order.customer.email}
                  </Link>
                ) : (
                  <p className="font-medium">
                    {shipping?.fullName ?? order.email} <span className="text-xs font-normal text-muted-foreground">(guest)</span>
                  </p>
                )}
                {order.customer && (
                  <p className="text-xs text-muted-foreground">
                    {order.customer._count.orders} {order.customer._count.orders === 1 ? "order" : "orders"}
                  </p>
                )}
                <a href={`mailto:${order.email}`} className="block text-muted-foreground hover:underline">{order.email}</a>
                <a href={`tel:+91${order.phone}`} className="block text-muted-foreground hover:underline">{order.phone}</a>
              </div>
              <AddressBlock title="Shipping address" address={shipping} />
              {sameAddress ? (
                <p className="text-xs text-muted-foreground">Billing address is the same as shipping.</p>
              ) : (
                <AddressBlock title="Billing address" address={billing} />
              )}
              <p className="text-xs text-muted-foreground">
                Place of supply: {order.placeOfSupply} ({order.intraState ? "CGST + SGST" : "IGST"})
              </p>
              {order.notes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Customer note</p>
                  <p className="whitespace-pre-line">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Totals({ order }: { order: AdminOrderDetail }) {
  // GST is included in the prices; same calculation as the orders CSV export.
  const { taxable, cgst, sgst, igst } = orderGstSplit(order);

  const row = (label: React.ReactNode, value: string, strong = false) => (
    <div className={strong ? "flex justify-between border-t pt-2 text-base font-semibold" : "flex justify-between"}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );

  return (
    <div className="ml-auto max-w-sm space-y-1.5 border-t pt-4 text-sm">
      {row("Subtotal", formatPrice(order.subtotal))}
      {order.discount > 0 &&
        row(
          <>
            Discount{" "}
            {order.coupon ? (
              <Link href={`/admin/coupons/${order.coupon.id}/edit`} className="font-mono text-primary hover:underline">{order.couponCode}</Link>
            ) : (
              order.couponCode && <span className="font-mono">{order.couponCode}</span>
            )}
          </>,
          `− ${formatPrice(order.discount)}`,
        )}
      {row("Shipping", order.shippingFee > 0 ? formatPrice(order.shippingFee) : "Free")}
      {order.codFee > 0 && row("COD fee", formatPrice(order.codFee))}
      {row("Total", formatPrice(order.total), true)}
      <div className="space-y-1 pt-2 text-xs text-muted-foreground">
        <div className="flex justify-between"><span>Taxable value</span><span>{formatPrice(taxable)}</span></div>
        {order.intraState ? (
          <>
            <div className="flex justify-between"><span>CGST</span><span>{formatPrice(cgst)}</span></div>
            <div className="flex justify-between"><span>SGST</span><span>{formatPrice(sgst)}</span></div>
          </>
        ) : (
          <div className="flex justify-between"><span>IGST</span><span>{formatPrice(igst)}</span></div>
        )}
      </div>
    </div>
  );
}

function AddressBlock({ title, address }: { title: string; address: AddressSnapshot | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      {address ? (
        <address className="not-italic">
          {address.fullName}
          <br />
          {address.line1}
          {address.line2 && (
            <>
              <br />
              {address.line2}
            </>
          )}
          <br />
          {address.city}, {address.state} {address.pincode}
          <br />
          {address.phone}
        </address>
      ) : (
        <p className="text-muted-foreground">Not available</p>
      )}
    </div>
  );
}

function eventTitle(type: string): string {
  const [kind, value] = type.split(":");
  if (kind === "note") return "Note";
  if (kind === "status" && value in orderStatusInfo) return `Status: ${orderStatusInfo[value as keyof typeof orderStatusInfo].label}`;
  if (kind === "payment" && value in paymentStatusInfo) return `Payment: ${paymentStatusInfo[value as keyof typeof paymentStatusInfo].label}`;
  if (kind === "shipment" && value in shipmentStatusLabel) return `Shipment: ${shipmentStatusLabel[value as keyof typeof shipmentStatusLabel]}`;
  return type;
}
