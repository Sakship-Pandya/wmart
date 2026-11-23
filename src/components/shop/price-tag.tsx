import { discountPercent, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PriceTag({ mrp, price, size = "md" }: { mrp: number; price: number; size?: "md" | "lg" }) {
  const off = discountPercent(mrp, price);
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={cn("font-bold text-brand", size === "lg" ? "text-3xl" : "text-lg")}>{formatPrice(price)}</span>
      {off > 0 && (
        <>
          <span className={cn("text-muted-foreground line-through", size === "lg" ? "text-base" : "text-sm")}>{formatPrice(mrp)}</span>
          <span className="rounded-full bg-sale-badge px-2 py-0.5 text-xs font-semibold text-background">-{off}%</span>
        </>
      )}
      <span className="w-full text-xs text-muted-foreground">18% GST included</span>
    </div>
  );
}
