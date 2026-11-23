import Image from "next/image";
import Link from "next/link";
import { discountPercent, formatPrice } from "@/lib/format";
import { CardAddToCart, QuickView, type CardActionProduct } from "./product-card-actions";

// Product card: image (with discount badge and Quick view), brand, title, price, Add To Cart.
export function ProductCard({ product }: { product: CardActionProduct & { category?: { name: string } } }) {
  const image = product.images[0];
  const off = discountPercent(product.mrp, product.price);
  const href = `/p/${product.slug}`;
  return (
    <div className="group flex flex-col rounded-2xl border bg-card p-3 transition hover:border-brand/40 hover:shadow-md">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        <Link href={href} tabIndex={-1} aria-hidden className="absolute inset-0">
          {image && (
            <Image
              src={image.url}
              alt=""
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              className="object-contain p-2 transition duration-300 group-hover:scale-105"
            />
          )}
        </Link>
        <div className="pointer-events-none absolute top-2 left-2 flex flex-col items-start gap-1">
          {off > 0 && <span className="rounded-full bg-sale-badge px-2 py-0.5 text-xs font-bold text-background">-{off}%</span>}
          {product.isOriginal && <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase text-brand-foreground">Original</span>}
        </div>
        <QuickView product={product} className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100" />
      </div>

      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{product.brand.name}</p>
      <Link href={href} className="mt-1 line-clamp-2 text-sm font-semibold text-heading hover:text-brand">
        {product.title}
      </Link>

      <div className="mt-auto space-y-3 pt-3">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-base font-bold text-brand">{formatPrice(product.price)}</span>
          {off > 0 && <span className="text-xs text-muted-foreground line-through">{formatPrice(product.mrp)}</span>}
          <span className="w-full text-[11px] text-muted-foreground">18% GST included</span>
        </div>
        <CardAddToCart product={product} />
      </div>
    </div>
  );
}
