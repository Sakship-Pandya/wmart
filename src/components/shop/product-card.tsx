import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ShieldCheck, Truck, Zap } from "lucide-react";
import { discountPercent, formatPrice } from "@/lib/format";
import { business } from "@/lib/site";
import { shortenText } from "@/lib/text";
import { cn } from "@/lib/utils";
import { CardAddToCart, QuickView, type CardActionProduct } from "./product-card-actions";

const LOW_STOCK = 5;
/** Characters of the description shown in a row (the full text is on the product page). */
const DESCRIPTION_CHARS = 200;

/** Plain-text start of a product description (drops any HTML left over from the old sites). */
function descriptionExcerpt(description: string | null | undefined): string {
  if (!description) return "";
  const plain = description
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/^\s*product description\s*:?\s*/i, "");
  return shortenText(plain, DESCRIPTION_CHARS);
}

// Product card: a full-width list row (like a marketplace search result) – large image on the left;
// title, price, delivery, a short description, then Add To Cart / Buy Now on the right.
export function ProductCard({
  product: { description, ...product },
  eager = false,
}: {
  product: CardActionProduct & { category?: { name: string }; description?: string | null };
  /** Load the image straight away (first row on the page, usually the largest image on screen). */
  eager?: boolean;
}) {
  // `description` is kept out of `product` so the full text isn't sent to the browser with the buttons.
  const image = product.images[0];
  const off = discountPercent(product.mrp, product.price);
  const href = `/p/${product.slug}`;
  const inStock = product.stock > 0;
  const warrantyMonths = product.isOriginal ? business.warrantyMonthsOriginal : business.warrantyMonthsCompatible;
  const excerpt = descriptionExcerpt(description);

  return (
    // The whole card opens the product page: the title link stretches over it (after:absolute after:inset-0).
    // Only the quick-view eye sits above it (z-10) and keeps its own action.
    <article className="group relative flex cursor-pointer overflow-hidden rounded-2xl border bg-card transition hover:border-brand/40 hover:shadow-md">
      {/* Image */}
      <div className="relative w-28 shrink-0 self-stretch bg-muted sm:w-44 lg:w-52">
        {image && (
          <Image
            src={image.url}
            alt=""
            fill
            loading={eager ? "eager" : "lazy"}
            sizes="(min-width: 1024px) 208px, (min-width: 640px) 176px, 112px"
            className="object-contain p-2 transition duration-300 group-hover:scale-105 sm:p-4"
          />
        )}
        {product.isOriginal && (
          <span className="pointer-events-none absolute top-2 left-2 rounded-md bg-brand px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-foreground">
            Original
          </span>
        )}
        <QuickView
          product={product}
          className="absolute top-2 right-2 z-10 size-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
        />
      </div>

      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-3 sm:px-5 sm:py-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {product.brand.name}
          {product.category && <span className="normal-case tracking-normal"> · {product.category.name}</span>}
        </p>

        <Link
          href={href}
          className="line-clamp-2 text-sm font-medium leading-snug text-heading outline-none group-hover:text-brand after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-brand/60 sm:text-base"
        >
          {product.title}
        </Link>

        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-lg font-bold text-heading sm:text-xl">{formatPrice(product.price)}</span>
          {off > 0 && (
            <>
              <span className="text-xs text-muted-foreground">
                M.R.P.: <span className="line-through">{formatPrice(product.mrp)}</span>
              </span>
              <span className="text-xs font-semibold text-success">({off}% off)</span>
            </>
          )}
          <span className="text-[11px] text-muted-foreground">incl. 18% GST</span>
        </div>

        <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-heading">
          <span className="inline-flex items-center gap-1">
            <Truck className="size-3.5 shrink-0 text-brand" aria-hidden />
            <span className="font-semibold">FREE delivery</span>
          </span>
          <span className="hidden items-center gap-1 sm:inline-flex">
            {product.isOriginal ? (
              <BadgeCheck className="size-3.5 shrink-0 text-brand" aria-hidden />
            ) : (
              <ShieldCheck className="size-3.5 shrink-0 text-brand" aria-hidden />
            )}
            {warrantyMonths} months warranty · {business.returnWindowDays} days returns
          </span>
          <span className={cn("font-medium", inStock && product.stock > LOW_STOCK ? "text-success" : "text-destructive")}>
            {!inStock ? "Out of stock" : product.stock <= LOW_STOCK ? `Only ${product.stock} left` : "In stock"}
          </span>
        </p>

        {excerpt && <p className="line-clamp-1 text-xs text-muted-foreground sm:text-[13px]">{excerpt}</p>}

        <div className="mt-1.5 flex items-center gap-2">
          {/* Add To Cart from tablet width up (hidden on phones to keep rows compact).
              relative z-10 lifts it above the card-wide link so it adds to the cart instead of opening the page. */}
          <div className="relative z-10 hidden w-36 sm:block">
            <CardAddToCart product={product} />
          </div>
          {/* Buy Now looks like a button; the click is handled by the card-wide link (opens the product page). */}
          <span
            aria-hidden
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full bg-brand px-4 text-xs font-semibold whitespace-nowrap text-brand-foreground transition group-hover:bg-brand/85 sm:h-9 sm:w-36 sm:text-sm"
          >
            <Zap className="size-3.5" />
            Buy Now
          </span>
        </div>
      </div>
    </article>
  );
}
