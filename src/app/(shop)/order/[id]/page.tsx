import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ExternalLink, Lock, Phone, Truck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shop/page-header";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { getCurrentCustomer } from "@/lib/customer-session";
import { hasOrderAccess } from "@/lib/order-access";
import { contact, delhiveryAwbUrl, whatsappUrl } from "@/lib/site";
import {
  asAddress,
  formatDateTimeIST,
  formatOrderNumber,
  orderStatusInfo,
  paymentMethodLabel,
  paymentStatusInfo,
  shipmentStatusLabel,
  toneClass,
  type AddressSnapshot,
} from "@/lib/orders";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };

// Order confirmation / status page. Shown only to the signed-in owner, or to the browser that
// placed the order or found it with Track order (signed cookie, see lib/order-access.ts).
export default function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<Skeleton className="h-[600px] rounded-2xl" />}>
      <OrderContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function OrderContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { title: "asc" } },
      shipments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!order) notFound();

  const customer = await getCurrentCustomer();
  const allowed = (customer && order.customerId === customer.id) || (await hasOrderAccess(order.id));
  if (!allowed) return <NoAccess />;

  const justPlaced = sp.placed === "1";
  const status = orderStatusInfo[order.status];
  const payment = paymentStatusInfo[order.paymentStatus];
  const shipping = asAddress(order.shippingAddress);
  const shipment = order.shipments[0];
  const number = formatOrderNumber(order.orderNumber);

  return (
    <div className="space-y-6">
      <PageHeader title={`Order ${number}`} crumbs={[{ label: "Home", href: "/" }, { label: `Order ${number}` }]} />

      {justPlaced && (
        <div className="flex gap-3 rounded-2xl border border-success/40 bg-success/10 p-5">
          <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-success" />
          <div className="space-y-1">
            <p className="text-lg font-bold text-heading">Thank you! Your order has been placed.</p>
            <p className="text-sm text-muted-foreground">
              Your order number is <span className="font-semibold text-heading">{number}</span>. Keep it to track your order.
              {order.paymentMethod === "COD" &&
                " Our team will call or WhatsApp you to confirm it before it ships. Please keep the cash ready on delivery."}
            </p>
          </div>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-4 rounded-2xl border p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Placed {formatDateTimeIST(order.createdAt)}</p>
            <div className="flex flex-wrap gap-2">
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", toneClass[status.tone])}>{status.label}</span>
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", toneClass[payment.tone])}>{payment.label}</span>
            </div>
          </div>

          <ul className="divide-y">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-contain p-1" />}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/p/${item.slug}`} className="line-clamp-2 text-sm font-medium text-heading hover:text-brand [overflow-wrap:anywhere]">
                    {item.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-semibold text-heading">{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <dl className="ml-auto max-w-xs space-y-1.5 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
                <dd>− {formatPrice(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>{order.shippingFee > 0 ? formatPrice(order.shippingFee) : "Free"}</dd>
            </div>
            {order.codFee > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">COD charges</dt>
                <dd>{formatPrice(order.codFee)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-base font-bold text-heading">
              <dt>Total</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
            <p className="text-right text-xs text-muted-foreground">18% GST included</p>
          </dl>
        </section>

        <aside className="space-y-4">
          <div className="space-y-2 rounded-2xl bg-muted p-5 text-sm">
            <p className="font-bold text-heading">Payment</p>
            <p>{paymentMethodLabel[order.paymentMethod]}</p>
            {order.paymentMethod === "COD" && order.paymentStatus === "PENDING" && (
              <p className="text-muted-foreground">Pay {formatPrice(order.total)} to the Delhivery courier on delivery.</p>
            )}
          </div>

          <div className="space-y-2 rounded-2xl bg-muted p-5 text-sm">
            <p className="flex items-center gap-2 font-bold text-heading">
              <Truck className="size-4 text-brand" /> Delivery
            </p>
            {shipment?.awb ? (
              <>
                <p>
                  {shipmentStatusLabel[shipment.status]} · AWB <span className="font-mono">{shipment.awb}</span>
                </p>
                <a href={delhiveryAwbUrl(shipment.awb)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-brand hover:underline">
                  Track on Delhivery <ExternalLink className="size-3.5" />
                </a>
              </>
            ) : (
              <p className="text-muted-foreground">
                {order.status === "CANCELLED" ? "This order was cancelled." : "Not shipped yet. You'll get the Delhivery tracking number once it ships."}
              </p>
            )}
            {shipping && <AddressText address={shipping} />}
          </div>

          <div className="space-y-2 rounded-2xl border p-5 text-sm">
            <p className="font-bold text-heading">Need help with this order?</p>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block font-medium text-brand hover:underline">
              WhatsApp us
            </a>
            <a href={contact.phoneHref} className="flex items-center gap-1 text-muted-foreground hover:text-heading">
              <Phone className="size-3.5" /> {contact.phoneDisplay}
            </a>
          </div>

          <div className="flex flex-col gap-2">
            {customer && (
              <Link href="/account/orders" className={buttonVariants({ variant: "outline" })}>
                All my orders
              </Link>
            )}
            <Link href="/" className={buttonVariants()}>
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function AddressText({ address }: { address: AddressSnapshot }) {
  return (
    <address className="not-italic text-muted-foreground">
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
      {address.city}, {address.state} – {address.pincode}
      <br />
      {address.phone}
    </address>
  );
}

function NoAccess() {
  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-2xl border p-8 text-center">
      <Lock className="mx-auto size-8 text-brand" />
      <h1 className="text-xl font-bold text-heading">Sign in to see this order</h1>
      <p className="text-sm text-muted-foreground">
        For your privacy, order details are shown only to the customer who placed the order. Sign in, or look up the order with its
        number and the email or mobile number used.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/login" className={buttonVariants()}>
          Sign in
        </Link>
        <Link href="/track-order" className={buttonVariants({ variant: "outline" })}>
          Track order
        </Link>
      </div>
    </div>
  );
}
