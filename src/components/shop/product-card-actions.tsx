"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { addToCart, updateCartItem, type CartActionState } from "@/server/actions/cart";
import { useCartQuantities } from "./cart/cart-quantities";
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

/**
 * "Add To Cart" (adds 1 without leaving the page). Once the product is in the cart the button turns
 * into a − 2 + counter; going down to 0 removes it and brings the button back.
 */
export function CardAddToCart({ product }: { product: CardActionProduct }) {
  const router = useRouter();
  const cart = useCartQuantities();
  const [state, action, pending] = useActionState(addToCart, idle);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message, { action: { label: "View cart", onClick: () => router.push("/cart") } });
      void cart?.reload();
    } else if (state.status === "error") toast.error(state.message);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- react to each new action result only
  }, [state]);

  if (product.stock <= 0) {
    return <p className="flex h-9 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">Out of stock</p>;
  }
  const inCart = cart?.quantity(product.id) ?? 0;
  if (inCart > 0 && cart) return <CardQuantity product={product} quantity={inCart} setQuantity={cart.setQuantity} />;

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

/** − 2 + counter shown instead of Add To Cart. Saves each change straight away (0 removes the item). */
function CardQuantity({
  product,
  quantity,
  setQuantity,
}: {
  product: CardActionProduct;
  quantity: number;
  setQuantity: (productId: string, quantity: number) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const max = Math.min(product.stock, 99);

  function change(next: number) {
    const q = Math.max(0, Math.min(max, next));
    setQuantity(product.id, q); // show it at once; the cart cookie is saved below
    const fd = new FormData();
    fd.set("productId", product.id);
    fd.set("quantity", String(q));
    startTransition(async () => {
      await updateCartItem(fd);
      router.refresh(); // header cart count
    });
  }

  const btn =
    "flex h-full w-9 items-center justify-center text-primary transition hover:bg-primary/10 disabled:opacity-40 disabled:hover:bg-transparent";
  return (
    <div
      role="group"
      aria-label={`Quantity of ${product.title} in cart`}
      aria-busy={pending}
      className="flex h-9 w-full items-center justify-between overflow-hidden rounded-full border-2 border-primary bg-background"
    >
      <button type="button" className={btn} onClick={() => change(quantity - 1)} aria-label={quantity === 1 ? "Remove from cart" : "Decrease quantity"}>
        {quantity === 1 ? <Trash2 className="size-4" /> : <Minus className="size-4" />}
      </button>
      <span className="text-sm font-semibold text-heading" aria-live="polite">
        {quantity} <span className="font-normal text-muted-foreground">in cart</span>
      </span>
      <button type="button" className={btn} onClick={() => change(quantity + 1)} disabled={quantity >= max} aria-label="Increase quantity">
        <Plus className="size-4" />
      </button>
    </div>
  );
}

/**
 * Eye button on the image that opens a quick preview with quantity, Add To Cart and Buy Now.
 * Clicking anywhere else on the preview opens the product page (the title link stretches over it).
 */
export function QuickView({ product, className }: { product: CardActionProduct; className?: string }) {
  const image = product.images[0];
  // Controlled so opening the product closes the popup (otherwise Back would show it still open).
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
      <DialogContent className="group max-h-[90vh] cursor-pointer overflow-y-auto sm:max-w-3xl">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
            {image && <Image src={image.url} alt={image.alt ?? product.title} fill sizes="(min-width: 640px) 384px, 90vw" className="object-contain p-4" />}
          </div>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Badge variant="secondary">{product.brand.name}</Badge>
              {product.isOriginal && <Badge variant="outline">Original</Badge>}
            </div>
            <DialogTitle className="text-xl font-bold leading-snug text-heading">
              <Link
                href={`/p/${product.slug}`}
                onClick={() => setOpen(false)}
                className="outline-none group-hover:text-brand after:absolute after:inset-0 after:content-[''] focus-visible:underline"
              >
                {product.title}
              </Link>
            </DialogTitle>
            <PriceTag mrp={product.mrp} price={product.price} />
            <p className={cn("text-sm font-medium", product.stock > 0 ? "text-success" : "text-destructive")}>
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </p>
            {/* relative z-10: above the popup-wide link, so these keep their own action. */}
            <div className="relative z-10 cursor-default">
              <AddToCartForm productId={product.id} stock={product.stock} layout="stacked" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
