import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shop/page-header";
import { CheckoutForm } from "@/components/shop/checkout/checkout-form";
import { OrderSummaryTotals } from "@/components/shop/cart/order-summary";
import { getCart } from "@/server/queries/cart";
import { getCustomerAddresses } from "@/server/queries/account";
import { getCurrentCustomer } from "@/lib/customer-session";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

// Checkout: contact, shipping/billing address, PayU or Cash on Delivery, order notes.
export default function CheckoutPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Checkout"
        crumbs={[{ label: "Home", href: "/" }, { label: "Cart", href: "/cart" }, { label: "Checkout" }]}
      />
      <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
        <CheckoutContents />
      </Suspense>
    </div>
  );
}

async function CheckoutContents() {
  const [cart, customer] = await Promise.all([getCart(), getCurrentCustomer()]);
  const saved = customer ? await getCustomerAddresses(customer.id) : null;
  const toInitial = (a: NonNullable<typeof saved>["shipping"]) =>
    a ? { fullName: a.fullName, phone: a.phone, line1: a.line1, line2: a.line2 ?? "", city: a.city, state: a.state, pincode: a.pincode } : undefined;
  // Signed-in customers start with their email and saved addresses (My account → Addresses).
  const initial = customer
    ? {
        email: customer.email,
        shipping: toInitial(saved?.shipping ?? null),
        billing: toInitial(saved?.billing ?? null),
        billingDiffers: Boolean(saved?.billing && saved.shipping && saved.billing.line1 + saved.billing.pincode !== saved.shipping.line1 + saved.shipping.pincode),
      }
    : undefined;

  if (cart.lines.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl bg-muted px-6 py-14 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-background text-brand">
          <ShoppingCart className="size-7" />
        </span>
        <h2 className="mt-4 text-xl font-bold">Your cart is empty</h2>
        <p className="mt-2 max-w-md text-muted-foreground">Add a product to your cart before checking out.</p>
        <Link href="/" className={cn(buttonVariants(), "mt-6 h-10 rounded-full px-6 text-base font-semibold")}>
          Return to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
      <CheckoutForm initial={initial} />

      <aside className="space-y-5 rounded-2xl bg-muted p-6 lg:sticky lg:top-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Your order</h2>
          <Link href="/cart" className="text-sm font-medium text-brand hover:underline">Edit cart</Link>
        </div>
        <ul className="space-y-3">
          {cart.lines.map((line) => (
            <li key={line.productId} className="flex items-center gap-3.5">
              <div className="relative size-20 shrink-0">
                <div className="relative size-full overflow-hidden rounded-xl border border-border/40 bg-background">
                  {line.image && <Image src={line.image.url} alt={line.image.alt ?? line.title} fill sizes="80px" className="object-contain p-1.5" />}
                </div>
                <span className="absolute -top-1.5 -right-1.5 z-10 flex size-5 items-center justify-center rounded-full bg-heading text-[10px] font-bold text-background shadow-sm">
                  {line.quantity}
                </span>
              </div>
              <p className="line-clamp-3 flex-1 text-sm font-medium text-heading leading-snug">{line.title}</p>
              <p className="shrink-0 text-sm font-semibold text-heading">{formatPrice(line.lineTotal)}</p>
            </li>
          ))}
        </ul>
        <div className="border-t pt-4">
          <OrderSummaryTotals cart={cart} />
        </div>
      </aside>
    </div>
  );
}
