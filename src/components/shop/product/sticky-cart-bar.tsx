"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { CardAddToCart, type CardActionProduct } from "@/components/shop/product-card-actions";

/**
 * Bar fixed to the bottom of the screen with the product and an Add To Cart button.
 * Appears once the main Add To Cart area has scrolled out of view (like the old site).
 */
export function StickyCartBar({ product, watchId }: { product: CardActionProduct; watchId: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(watchId);
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      // Show only after scrolling past it (not before reaching it).
      setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [watchId]);

  const image = product.images[0];
  return (
    <div
      aria-hidden={!visible}
      inert={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur transition-transform duration-300 motion-reduce:transition-none",
        visible ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        {image && (
          <div className="relative hidden size-12 shrink-0 overflow-hidden rounded-lg bg-muted sm:block">
            <Image src={image.url} alt="" fill sizes="48px" className="object-contain p-1" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-heading">{product.title}</p>
          <p className="text-sm font-bold text-brand">{formatPrice(product.price)}</p>
        </div>
        <div className="w-40 shrink-0 sm:w-48">
          <CardAddToCart product={product} />
        </div>
      </div>
    </div>
  );
}
