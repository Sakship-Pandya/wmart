import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ProductGrid, ProductGridSkeleton } from "@/components/shop/product-grid";
import { getBrandBySlug, listProductsByBrand } from "@/server/queries/products";

// Brand page, e.g. /brand/dell
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
  if (!brand) notFound();
  const products = await listProductsByBrand(slug);
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">{brand.name} laptop batteries &amp; adapters</h1>
      <ProductGrid products={products} />
    </>
  );
}
