import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ProductCardData } from "@/server/queries/products";
import { PriceTag } from "./price-tag";

export function ProductCard({ product }: { product: ProductCardData }) {
  const image = product.images[0];
  return (
    <Link
      href={`/p/${product.slug}`}
      className="group flex flex-col rounded-lg border bg-card p-3 transition hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
        {image && (
          <Image
            src={image.url}
            alt={image.alt ?? product.title}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-contain p-2"
          />
        )}
      </div>
      <div className="mt-3 flex gap-1.5">
        <Badge variant="secondary">{product.brand.name}</Badge>
        {product.isOriginal && <Badge variant="outline">Original</Badge>}
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-medium group-hover:underline">{product.title}</p>
      <div className="mt-auto pt-2">
        <PriceTag mrp={product.mrp} price={product.price} />
        {product.stock <= 0 && <p className="mt-1 text-xs text-destructive">Out of stock</p>}
      </div>
    </Link>
  );
}
