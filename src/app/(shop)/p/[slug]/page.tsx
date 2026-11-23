import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, CircleCheck, Tag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { PriceTag } from "@/components/shop/price-tag";
import { ProductGrid } from "@/components/shop/product-grid";
import { AddToCartForm } from "@/components/shop/cart/add-to-cart-form";
import { ProductGallery } from "@/components/shop/product/product-gallery";
import { StickyCartBar } from "@/components/shop/product/sticky-cart-bar";
import { getProductBySlug, listRelatedProducts } from "@/server/queries/products";
import { discountPercent } from "@/lib/format";
import { productPromo, trustPoints } from "@/lib/site";

// Product page, e.g. /p/hp-hs04-41wh-battery – gallery, price, quantity, Add To Cart / Buy Now,
// promo, trust points, specification table, description, part numbers, compatible models,
// related products and a sticky Add To Cart bar (same features as the old site).
// TODO (store UI): reviews (needs a Review table), Delhivery pincode check.

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.title,
    description: product.description?.slice(0, 160) ?? `${product.title} – ${product.brand.name}`,
    openGraph: { images: product.images[0] ? [product.images[0].url] : undefined },
  };
}

export default function ProductPage({ params }: PageProps<"/p/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

/** "voltage" / "capacity_wh" / "outputPower" -> "Voltage" / "Capacity wh" / "Output power" */
function specLabel(key: string) {
  const words = key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

async function ProductContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.isActive) notFound();

  const related = await listRelatedProducts(product);
  const off = discountPercent(product.mrp, product.price);
  const inStock = product.stock > 0;

  const specs: [string, string][] = [
    ["Brand", product.brand.name],
    ["Category", product.category.name],
    ["Type", product.isOriginal ? "Original (OEM)" : "Compatible"],
  ];
  if (product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)) {
    for (const [k, v] of Object.entries(product.specs)) {
      if (v !== null && v !== "" && (typeof v === "string" || typeof v === "number" || typeof v === "boolean")) specs.push([specLabel(k), String(v)]);
    }
  }
  if (product.hsnCode) specs.push(["HSN code", product.hsnCode]);
  specs.push(["GST", `${product.gstRate}% (included in price)`]);

  const cardProduct = {
    id: product.id,
    slug: product.slug,
    title: product.title,
    mrp: product.mrp,
    price: product.price,
    stock: product.stock,
    isOriginal: product.isOriginal,
    brand: { name: product.brand.name },
    images: product.images.slice(0, 1).map((i) => ({ url: i.url, alt: i.alt })),
  };

  // Product details for Google (rich results with price and availability).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.images.map((i) => i.url),
    description: product.description ?? undefined,
    brand: { "@type": "Brand", name: product.brand.name },
    mpn: product.partNumbers[0]?.code,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: (product.price / 100).toFixed(2),
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <div className="space-y-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            { label: product.category.name, href: `/c/${product.category.slug}` },
            { label: product.brand.name, href: `/brand/${product.brand.slug}` },
          ]}
        />

        <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
          <ProductGallery images={product.images} title={product.title} badge={off > 0 ? `-${off}%` : undefined} />

          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Link href={`/brand/${product.brand.slug}`} className="font-semibold uppercase tracking-wide text-muted-foreground hover:text-brand">
                {product.brand.name}
              </Link>
              {product.isOriginal && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                  <BadgeCheck className="size-3.5" /> Original
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold leading-snug lg:text-3xl">{product.title}</h1>

            {productPromo.enabled && (
              <div className="flex items-start gap-3 rounded-2xl border border-dashed border-brand/50 bg-brand/5 p-4">
                <Tag className="mt-0.5 size-5 shrink-0 text-brand" />
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-heading">{productPromo.title}</p>
                  <p className="text-muted-foreground">{productPromo.text}</p>
                </div>
                <span className="rounded-lg bg-background px-2.5 py-1 font-mono text-sm font-bold text-brand">{productPromo.code}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <span className={inStock ? "inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-sm font-medium text-success" : "inline-flex rounded-full bg-destructive/10 px-2.5 py-1 text-sm font-medium text-destructive"}>
                {inStock ? <><CircleCheck className="size-4" /> {product.stock} in stock</> : "Out of stock"}
              </span>
              {product.partNumbers[0] && (
                <span className="text-sm text-muted-foreground">
                  Part no.: <span className="font-medium text-heading">{product.partNumbers[0].code}</span>
                </span>
              )}
            </div>

            <PriceTag mrp={product.mrp} price={product.price} size="lg" />

            <div id="main-add-to-cart">
              <AddToCartForm productId={product.id} stock={product.stock} />
            </div>

            <ul className="grid gap-2 border-t pt-5 text-sm sm:grid-cols-2">
              {trustPoints.map((t) => (
                <li key={t} className="flex items-center gap-2 text-heading">
                  <CircleCheck className="size-4 shrink-0 text-success" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="desc-heading" className="space-y-3">
            <h2 id="desc-heading" className="text-xl font-bold">Description</h2>
            {product.description ? (
              <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{product.description}</p>
            ) : (
              <p className="text-muted-foreground">No description yet.</p>
            )}
          </section>

          {product.partNumbers.length > 0 && (
            <section aria-labelledby="parts-heading" className="space-y-3">
              <h2 id="parts-heading" className="text-xl font-bold">Compatible part numbers</h2>
              <ul className="flex flex-wrap gap-2">
                {product.partNumbers.map((p) => (
                  <li key={p.id}>
                    <Link href={`/search?q=${encodeURIComponent(p.code)}`} className="inline-block rounded-full border px-3 py-1 font-mono text-sm hover:border-brand hover:text-brand">
                      {p.code}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {product.compatibleWith.length > 0 && (
            <section aria-labelledby="models-heading" className="space-y-3">
              <h2 id="models-heading" className="text-xl font-bold">Compatible laptop models</h2>
              <ul className="grid gap-x-6 gap-y-1.5 text-sm text-heading sm:grid-cols-2">
                {product.compatibleWith.map((m) => (
                  <li key={m.id} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-brand" /> {m.name}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <section aria-labelledby="spec-heading" className="h-fit rounded-2xl bg-muted p-5">
          <h2 id="spec-heading" className="mb-3 text-xl font-bold">Specification</h2>
          <dl className="divide-y divide-border text-sm">
            {specs.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right font-medium text-heading">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <h2 id="related-heading" className="text-2xl font-bold">You may also like</h2>
            <Link href={`/c/${product.category.slug}`} className="text-sm font-medium text-brand hover:underline">
              View all {product.category.name}
            </Link>
          </div>
          <ProductGrid products={related} />
        </section>
      )}

      <StickyCartBar product={cardProduct} watchId="main-add-to-cart" />
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-80" />
      <div className="grid gap-8 md:grid-cols-2">
        <Skeleton className="aspect-square rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-10 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
