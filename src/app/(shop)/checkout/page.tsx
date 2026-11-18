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
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

// Checkout: contact, shipping/billing address, PayU or Cash on Delivery, order notes.
// TODO (store UI): Delhivery pincode serviceability check.
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
  const cart = await getCart();

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
      <CheckoutForm />

      <aside className="space-y-5 rounded-2xl bg-muted p-6 lg:sticky lg:top-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Your order</h2>
          <Link href="/cart" className="text-sm font-medium text-brand hover:underline">Edit cart</Link>
        </div>
        <ul className="space-y-3">
          {cart.lines.map((line) => (
            <li key={line.productId} className="flex gap-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-background">
                {line.image && <Image src={line.image.url} alt={line.image.alt ?? line.title} fill sizes="56px" className="object-contain p-1" />}
                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-heading text-[10px] font-bold text-background">
                  {line.quantity}
                </span>
              </div>
              <p className="line-clamp-2 flex-1 text-sm text-heading">{line.title}</p>
              <p className="text-sm font-semibold text-heading">{formatPrice(line.lineTotal)}</p>
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
