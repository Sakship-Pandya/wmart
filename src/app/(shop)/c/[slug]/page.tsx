import { Suspense } from "react";
import { NoProducts } from "@/components/shop/no-products";
import { ProductListing, ProductListingSkeleton } from "@/components/shop/listing/product-listing";
import { getCategoryBySlug } from "@/server/queries/products";
import { titleFromSlug } from "@/lib/site";

// Category page, e.g. /c/laptop-batteries – filters, sorting and pages like the old site.
// If the category is empty or not in the database yet, a friendly message is shown instead of a 404.
export default function CategoryPage({ params, searchParams }: PageProps<"/c/[slug]">) {
  return (
    <Suspense fallback={<ProductListingSkeleton />}>
      <CategoryContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CategoryContent({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);
  const name = category?.name ?? titleFromSlug(slug);
  return (
    <ProductListing
      pathname={`/c/${slug}`}
      scope={{ categorySlug: slug }}
      query={query}
      title={name}
      crumbs={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: name }]}
      empty={
        <NoProducts
          title={`No products in ${name} yet`}
          message="We're adding products to this category. Search by your laptop model or part number, or browse another category."
        />
      }
    />
  );
}
