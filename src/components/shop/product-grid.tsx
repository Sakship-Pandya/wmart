import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { NoProducts } from "./no-products";
import { ProductCard } from "./product-card";
import type { CardActionProduct } from "./product-card-actions";

export function ProductGrid({
  products,
  empty = <NoProducts />,
}: {
  products: (CardActionProduct & { category?: { name: string }; description?: string | null })[];
  /** What to show when there are no products (defaults to the "No products to show yet" box). */
  empty?: ReactNode;
}) {
  if (products.length === 0) return <>{empty}</>;
  return (
    <div className="flex flex-col gap-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} eager={i === 0} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-44 w-full rounded-2xl sm:h-48" />
      ))}
    </div>
  );
}
