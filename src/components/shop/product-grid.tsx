import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { NoProducts } from "./no-products";
import { ProductCard } from "./product-card";
import type { CardActionProduct } from "./product-card-actions";

const colClasses = {
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
} as const;

export function ProductGrid({
  products,
  empty = <NoProducts />,
  cols = 4,
}: {
  products: CardActionProduct[];
  /** What to show when there are no products (defaults to the "No products to show yet" box). */
  empty?: ReactNode;
  /** Products per row on large screens (the old site's 3 / 4 switch). */
  cols?: 3 | 4;
}) {
  if (products.length === 0) return <>{empty}</>;
  return (
    <div className={cn("grid gap-4", colClasses[cols])}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8, cols = 4 }: { count?: number; cols?: 3 | 4 }) {
  return (
    <div className={cn("grid gap-4", colClasses[cols])}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
      ))}
    </div>
  );
}
