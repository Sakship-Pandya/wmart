import { Suspense } from "react";
import { ProductGrid, ProductGridSkeleton } from "@/components/shop/product-grid";
import { NoProducts } from "@/components/shop/no-products";
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
      <ProductGrid
        products={products}
        empty={
          query ? (
            <NoProducts
              title={`No results for “${query}”`}
              message="Check the spelling, or try the part number printed on your old battery or charger (e.g. HS04, MR90Y) or your laptop model (e.g. Inspiron 3521)."
            />
          ) : (
            <NoProducts
              title="Search for a battery, adapter or cable"
              message="Type your laptop model or the part number printed on your old battery or charger."
            />
          )
        }
      />
    </>
  );
}
