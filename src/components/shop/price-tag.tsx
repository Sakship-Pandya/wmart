import { discountPercent, formatPrice } from "@/lib/format";

export function PriceTag({ mrp, price }: { mrp: number; price: number }) {
  const off = discountPercent(mrp, price);
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="text-lg font-semibold">{formatPrice(price)}</span>
      {off > 0 && (
        <>
          <span className="text-sm text-muted-foreground line-through">{formatPrice(mrp)}</span>
          <span className="text-sm font-medium text-green-700 dark:text-green-400">-{off}%</span>
        </>
      )}
      <span className="w-full text-xs text-muted-foreground">18% GST included</span>
    </div>
  );
}
