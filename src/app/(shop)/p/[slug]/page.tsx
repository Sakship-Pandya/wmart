import { Suspense } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PriceTag } from "@/components/shop/price-tag";
import { AddToCartForm } from "@/components/shop/cart/add-to-cart-form";
import { getProductBySlug } from "@/server/queries/products";

// Product page, e.g. /p/hp-hs04-41wh-battery
// TODO (store UI): image gallery, pincode check, specs table, JSON-LD, reviews.
export default function ProductPage({ params }: PageProps<"/p/[slug]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.isActive) notFound();
  const image = product.images[0];

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="relative aspect-square rounded-lg bg-muted">
        {image && (
          <Image
            src={image.url}
            alt={image.alt ?? product.title}
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-contain p-4"
          />
        )}
      </div>
      <div className="space-y-4">
        <div className="flex gap-2">
          <Badge variant="secondary">{product.brand.name}</Badge>
          {product.isOriginal && <Badge variant="outline">Original</Badge>}
        </div>
        <h1 className="text-2xl font-bold">{product.title}</h1>
        <PriceTag mrp={product.mrp} price={product.price} />
        <p className="text-sm">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</p>
        <AddToCartForm productId={product.id} stock={product.stock} />

        {product.partNumbers.length > 0 && (
          <div>
            <h2 className="font-semibold">Part numbers</h2>
            <p className="text-sm text-muted-foreground">
              {product.partNumbers.map((p) => p.code).join(", ")}
            </p>
          </div>
        )}
        {product.compatibleWith.length > 0 && (
          <div>
            <h2 className="font-semibold">Compatible with</h2>
            <ul className="list-inside list-disc text-sm text-muted-foreground">
              {product.compatibleWith.map((m) => (
                <li key={m.id}>{m.name}</li>
              ))}
            </ul>
          </div>
        )}
        {product.description && (
          <div>
            <h2 className="font-semibold">Description</h2>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{product.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
