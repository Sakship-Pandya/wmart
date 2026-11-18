import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ProductGrid, ProductGridSkeleton } from "@/components/shop/product-grid";
import { getCategoryBySlug, listProductsByCategory } from "@/server/queries/products";

// Category page, e.g. /c/laptop-batteries
export default function CategoryPage({ params }: PageProps<"/c/[slug]">) {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <CategoryContent params={params} />
    </Suspense>
  );
}

async function CategoryContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const products = await listProductsByCategory(slug);
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">{category.name}</h1>
      <ProductGrid products={products} />
    </>
  );
}
