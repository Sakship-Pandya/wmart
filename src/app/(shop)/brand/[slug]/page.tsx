import { Suspense } from "react";
import { NoProducts } from "@/components/shop/no-products";
import { ProductListing, ProductListingSkeleton } from "@/components/shop/listing/product-listing";
import { getBrandBySlug } from "@/server/queries/products";
import { titleFromSlug } from "@/lib/site";

// Brand page, e.g. /brand/dell – filters, sorting and pages like the old site.
// If the brand has no products or is not in the database yet, a friendly message is shown instead of a 404.
export default function BrandPage({ params, searchParams }: PageProps<"/brand/[slug]">) {
  return (
    <Suspense fallback={<ProductListingSkeleton />}>
      <BrandContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function BrandContent({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const brand = await getBrandBySlug(slug);
  const name = brand?.name ?? titleFromSlug(slug).toUpperCase();
  return (
    <ProductListing
      pathname={`/brand/${slug}`}
      scope={{ brandSlug: slug }}
      query={query}
      title={<>{name} laptop batteries &amp; adapters</>}
      crumbs={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: name }]}
      empty={
        <NoProducts
          title={`No ${name} products yet`}
          message={`We're adding ${name} batteries and adapters. Search by your laptop model or part number, or browse a category.`}
        />
      }
    />
  );
}
