import { Suspense } from "react";
import { ProductGrid, ProductGridSkeleton } from "@/components/shop/product-grid";
import { NoProducts } from "@/components/shop/no-products";
import { getBrandBySlug, listProductsByBrand } from "@/server/queries/products";
import { titleFromSlug } from "@/lib/site";

// Brand page, e.g. /brand/dell
// If the brand has no products or is not in the database yet, a friendly message is shown instead of a 404.
export default function BrandPage({ params }: PageProps<"/brand/[slug]">) {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <BrandContent params={params} />
    </Suspense>
  );
}

async function BrandContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  const name = brand?.name ?? titleFromSlug(slug).toUpperCase();
  const products = brand ? await listProductsByBrand(slug) : [];
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">{name} laptop batteries &amp; adapters</h1>
      <ProductGrid
        products={products}
        empty={
          <NoProducts
            title={`No ${name} products yet`}
            message={`We're adding ${name} batteries and adapters. Search by your laptop model or part number, or browse a category.`}
          />
        }
      />
    </>
  );
}
