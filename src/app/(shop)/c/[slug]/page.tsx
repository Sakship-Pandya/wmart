import { Suspense } from "react";
import { ProductGrid, ProductGridSkeleton } from "@/components/shop/product-grid";
import { NoProducts } from "@/components/shop/no-products";
import { getCategoryBySlug, listProductsByCategory } from "@/server/queries/products";
import { titleFromSlug } from "@/lib/site";

// Category page, e.g. /c/laptop-batteries
// If the category is empty or not in the database yet, a friendly message is shown instead of a 404.
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
  const name = category?.name ?? titleFromSlug(slug);
  const products = category ? await listProductsByCategory(slug) : [];
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">{name}</h1>
      <ProductGrid
        products={products}
        empty={
          <NoProducts
            title={`No products in ${name} yet`}
            message="We're adding products to this category. Search by your laptop model or part number, or browse another category."
          />
        }
      />
    </>
  );
}
