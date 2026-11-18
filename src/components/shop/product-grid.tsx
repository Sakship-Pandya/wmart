import type { ReactNode } from "react";
import type { ProductCardData } from "@/server/queries/products";
import { Skeleton } from "@/components/ui/skeleton";
import { NoProducts } from "./no-products";
import { ProductCard } from "./product-card";

export function ProductGrid({
  products,
  empty = <NoProducts />,
}: {
  products: ProductCardData[];
  /** What to show when there are no products (defaults to the "No products to show yet" box). */
  empty?: ReactNode;
}) {
  if (products.length === 0) return <>{empty}</>;
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
      ))}
    </div>
  );
}
