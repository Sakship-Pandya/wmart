import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { NoProducts } from "./no-products";
import { ProductCard } from "./product-card";
import type { CardActionProduct } from "./product-card-actions";

export function ProductGrid({
  products,
  empty = <NoProducts />,
}: {
  products: CardActionProduct[];
  /** What to show when there are no products (defaults to the "No products to show yet" box). */
  empty?: ReactNode;
  /** @deprecated cols is ignored – layout is now a single-column list. */
  cols?: 3 | 4;
}) {
  if (products.length === 0) return <>{empty}</>;
  return (
    <div className="flex flex-col gap-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number; cols?: 3 | 4 }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-36 w-full rounded-2xl" />
      ))}
    </div>
  );
}
