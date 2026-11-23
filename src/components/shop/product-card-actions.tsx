"use client";

import { useActionState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { addToCart, type CartActionState } from "@/server/actions/cart";
import { AddToCartForm } from "./cart/add-to-cart-form";
import { PriceTag } from "./price-tag";
import { cn } from "@/lib/utils";

export type CardActionProduct = {
  id: string;
  slug: string;
  title: string;
  mrp: number;
  price: number;
  stock: number;
  isOriginal: boolean;
  brand: { name: string };
  images: { url: string; alt: string | null }[];
};

const idle: CartActionState = { status: "idle" };

/** "Add To Cart" (adds 1 without leaving the page) – same as the old site's product cards. */
export function CardAddToCart({ product }: { product: CardActionProduct }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(addToCart, idle);

  useEffect(() => {
    if (state.status === "success") toast.success(state.message, { action: { label: "View cart", onClick: () => router.push("/cart") } });
    else if (state.status === "error") toast.error(state.message);
  }, [state, router]);

  if (product.stock <= 0) {
    return <p className="flex h-9 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">Out of stock</p>;
  }
  return (
    <form action={action}>
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="quantity" value="1" />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/85 disabled:opacity-60"
      >
        <ShoppingCart className="size-4" />
        {pending ? "Adding…" : "Add To Cart"}
      </button>
    </form>
  );
}

/** Eye button on the image that opens a quick preview with quantity, Add To Cart and Buy Now. */
export function QuickView({ product, className }: { product: CardActionProduct; className?: string }) {
  const image = product.images[0];
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            aria-label={`Quick view: ${product.title}`}
            className={cn(
              "flex size-9 items-center justify-center rounded-full bg-background/95 text-heading shadow-sm transition hover:bg-brand hover:text-brand-foreground",
              className,
            )}
          />
        }
      >
        <Eye className="size-4" />
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
            {image && <Image src={image.url} alt={image.alt ?? product.title} fill sizes="(min-width: 640px) 384px, 90vw" className="object-contain p-4" />}
          </div>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Badge variant="secondary">{product.brand.name}</Badge>
              {product.isOriginal && <Badge variant="outline">Original</Badge>}
            </div>
            <DialogTitle className="text-xl font-bold leading-snug text-heading">{product.title}</DialogTitle>
            <PriceTag mrp={product.mrp} price={product.price} />
            <p className={cn("text-sm font-medium", product.stock > 0 ? "text-success" : "text-destructive")}>
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </p>
            <AddToCartForm productId={product.id} stock={product.stock} />
            <Link href={`/p/${product.slug}`} className="inline-block text-sm font-medium text-brand hover:underline">
              View full details →
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
