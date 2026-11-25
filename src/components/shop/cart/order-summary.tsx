import { formatPrice } from "@/lib/format";
import type { Cart } from "@/server/queries/cart";

// Totals box used on the cart and checkout pages.
export function OrderSummaryTotals({ cart }: { cart: Cart }) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Price ({cart.itemCount} {cart.itemCount === 1 ? "item" : "items"})</dt>
        <dd>{formatPrice(cart.mrpTotal)}</dd>
      </div>
      {cart.savings > 0 && (
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Discount</dt>
          <dd className="font-medium text-success">− {formatPrice(cart.savings)}</dd>
        </div>
      )}
      {cart.couponDiscount > 0 && cart.coupon?.ok && (
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            Coupon <span className="font-mono font-medium text-heading">{cart.coupon.code}</span>
          </dt>
          <dd className="font-medium text-success">− {formatPrice(cart.couponDiscount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Shipping</dt>
        <dd className="font-medium text-success">{cart.shipping === 0 ? "Free" : formatPrice(cart.shipping)}</dd>
      </div>
      <div className="flex justify-between border-t pt-3 text-base">
        <dt className="font-bold text-heading">Total</dt>
        <dd className="font-bold text-heading">{formatPrice(cart.total)}</dd>
      </div>
      <p className="text-xs text-muted-foreground">All prices include 18% GST.</p>
    </dl>
  );
}
