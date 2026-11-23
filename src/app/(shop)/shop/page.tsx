import { Suspense } from "react";
import type { Metadata } from "next";
import { NoProducts } from "@/components/shop/no-products";
import { ProductListing, ProductListingSkeleton } from "@/components/shop/listing/product-listing";

export const metadata: Metadata = {
  title: "Shop all products",
  description: "Laptop batteries, adapters, chargers, keyboards and power cables for every major brand.",
};

// All products (the old site's "Shop" page), with category / brand / price filters.
export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <Suspense fallback={<ProductListingSkeleton />}>
      <ShopContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ShopContent({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  return (
    <ProductListing
      pathname="/shop"
      scope={{}}
      query={query}
      title="Shop"
      crumbs={[{ label: "Home", href: "/" }, { label: "Shop" }]}
      empty={<NoProducts title="No products yet" message="Products added in the admin panel will appear here." />}
    />
  );
}
