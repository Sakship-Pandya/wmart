import { discountPercent, formatPrice } from "@/lib/format";

export function PriceTag({ mrp, price }: { mrp: number; price: number }) {
  const off = discountPercent(mrp, price);
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="text-lg font-bold text-brand">{formatPrice(price)}</span>
      {off > 0 && (
        <>
          <span className="text-sm text-muted-foreground line-through">{formatPrice(mrp)}</span>
          <span className="rounded-full bg-sale-badge px-2 py-0.5 text-xs font-semibold text-background">-{off}%</span>
        </>
      )}
      <span className="w-full text-xs text-muted-foreground">18% GST included</span>
    </div>
  );
}
