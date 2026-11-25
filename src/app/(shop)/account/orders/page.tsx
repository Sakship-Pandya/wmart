import Image from "next/image";
import Link from "next/link";
import { AccountEmptyState } from "@/components/shop/account/empty-state";
import { requireCustomer } from "@/lib/customer-session";
import { getCustomerOrders } from "@/server/queries/account";
import { formatOrderNumber, orderStatusInfo, paymentMethodLabel, paymentStatusInfo, toneClass } from "@/lib/orders";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Orders" };

const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

// My account → Orders: the signed-in customer's orders, newest first.
// Each order opens /order/[id] (items, totals, address, Delhivery tracking).
export default async function OrdersPage() {
  const customer = await requireCustomer("/account/orders");
  const orders = await getCustomerOrders(customer.id);
  if (orders.length === 0) return <AccountEmptyState message="No order has been made yet." />;

  return (
    <ul className="space-y-4">
      {orders.map((o) => {
        const status = orderStatusInfo[o.status];
        const payment = paymentStatusInfo[o.paymentStatus];
        const count = o.items.reduce((s, i) => s + i.quantity, 0);
        return (
          <li key={o.id} className="rounded-2xl border p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link href={`/order/${o.id}`} className="font-bold text-heading hover:text-brand">
                  Order {formatOrderNumber(o.orderNumber)} →
                </Link>
                <p className="text-sm text-muted-foreground">
                  {dateFormat.format(o.createdAt)} · {count} {count === 1 ? "item" : "items"} · {paymentMethodLabel[o.paymentMethod]}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", toneClass[status.tone])}>{status.label}</span>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", toneClass[payment.tone])}>{payment.label}</span>
                <span className="text-lg font-bold text-heading">{formatPrice(o.total)}</span>
              </div>
            </div>
            <ul className="mt-4 flex flex-wrap gap-3">
              {o.items.map((i) => (
                <li key={i.slug}>
                  <Link href={`/p/${i.slug}`} className="flex max-w-xs items-center gap-2 rounded-xl bg-muted p-2 pr-3 text-sm hover:text-brand">
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-background">
                      {i.imageUrl && <Image src={i.imageUrl} alt="" fill sizes="40px" className="object-contain p-0.5" />}
                    </span>
                    <span className="line-clamp-1">{i.quantity} × {i.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}
