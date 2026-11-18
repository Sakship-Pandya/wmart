import { NoProducts } from "@/components/shop/no-products";

// Shown when a product link points to a product that doesn't exist or is hidden.
export default function ProductNotFound() {
  return (
    <NoProducts
      title="This product is no longer available"
      message="It may have been removed or renamed. Search for your laptop model or part number to find a replacement."
    />
  );
}
