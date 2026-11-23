import { Suspense } from "react";
import type { Metadata } from "next";
import { NoProducts } from "@/components/shop/no-products";
import { ProductListing, ProductListingSkeleton } from "@/components/shop/listing/product-listing";

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

// Search page: /search?q=HS04 – matches titles, part numbers and laptop models, with the same filters as the shop.
export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <Suspense fallback={<ProductListingSkeleton />}>
      <SearchResults searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchResults({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q.trim() : "";
  if (!q) {
    return (
      <NoProducts
        title="Search for a battery, adapter or cable"
        message="Type your laptop model or the part number printed on your old battery or charger."
      />
    );
  }
  return (
    <ProductListing
      pathname="/search"
      scope={{ q }}
      query={query}
      title={<>Results for &ldquo;{q}&rdquo;</>}
      crumbs={[{ label: "Home", href: "/" }, { label: "Search" }]}
      empty={
        <NoProducts
          title={`No results for “${q}”`}
          message="Check the spelling, or try the part number printed on your old battery or charger (e.g. HS04, MR90Y) or your laptop model (e.g. Inspiron 3521)."
        />
      }
    />
  );
}
