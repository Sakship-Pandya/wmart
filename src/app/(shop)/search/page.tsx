import { Suspense } from "react";
import { ProductGrid, ProductGridSkeleton } from "@/components/shop/product-grid";
import { searchProducts } from "@/server/queries/products";

// Search page: /search?q=HS04
export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <SearchResults searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchResults({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";
  const products = await searchProducts(query);
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">
        {query ? <>Results for &ldquo;{query}&rdquo;</> : "Search"}
      </h1>
      <ProductGrid products={products} />
    </>
  );
}
