import Image from "next/image";
import Link from "next/link";
import { discountPercent, formatPrice } from "@/lib/format";
import { CardAddToCart, QuickView, type CardActionProduct } from "./product-card-actions";

// Product card: horizontal list row – image left, info centre, actions right.
export function ProductCard({ product }: { product: CardActionProduct & { category?: { name: string } } }) {
  const image = product.images[0];
  const off = discountPercent(product.mrp, product.price);
  const href = `/p/${product.slug}`;
  return (
    <div className="group flex flex-row items-center gap-4 rounded-2xl border bg-card p-3 transition hover:border-brand/40 hover:shadow-md sm:p-4">
      {/* Image */}
      <div className="relative size-28 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-36">
        <Link href={href} tabIndex={-1} aria-hidden className="absolute inset-0">
          {image && (
            <Image
              src={image.url}
              alt=""
              fill
              sizes="144px"
              className="object-contain p-2 transition duration-300 group-hover:scale-105"
            />
          )}
        </Link>
        <div className="pointer-events-none absolute top-1.5 left-1.5 flex flex-col items-start gap-1">
          {off > 0 && <span className="rounded-full bg-sale-badge px-2 py-0.5 text-[10px] font-bold text-background">-{off}%</span>}
          {product.isOriginal && <span className="rounded-full bg-brand px-1.5 py-0.5 text-[9px] font-bold uppercase text-brand-foreground">Original</span>}
        </div>
        <QuickView product={product} className="absolute top-1.5 right-1.5 size-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100" />
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{product.brand.name}</p>
        <Link href={href} className="line-clamp-2 text-sm font-semibold text-heading hover:text-brand sm:text-base">
          {product.title}
        </Link>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-base font-bold text-brand sm:text-lg">{formatPrice(product.price)}</span>
          {off > 0 && <span className="text-xs text-muted-foreground line-through">{formatPrice(product.mrp)}</span>}
          <span className="text-[11px] text-muted-foreground">18% GST included</span>
        </div>
      </div>

      {/* Add to cart */}
      <div className="hidden w-40 shrink-0 sm:block">
        <CardAddToCart product={product} />
      </div>
      {/* Mobile: full-width add to cart below (handled by the parent stacking) */}
    </div>
  );
}
