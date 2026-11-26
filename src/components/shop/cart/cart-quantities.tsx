"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Cart } from "@/server/queries/cart";

// How many of each product are in the cart, shared by every product card on the page so their
// "Add To Cart" buttons can turn into a − 2 + counter. Loaded once from /api/cart, updated
// straight away by the cards, and reloaded when anything else changes the cart
// (mini-cart, cart page) via notifyCartChanged(), or when the tab gets focus again.

const CART_EVENT = "wmart:cart-changed";

type CartQuantities = {
  quantity: (productId: string) => number;
  setQuantity: (productId: string, quantity: number) => void;
  reload: () => Promise<void>;
};

const Ctx = createContext<CartQuantities | null>(null);

/** Tell product cards the cart changed somewhere else, so they reload their quantities. */
export function notifyCartChanged() {
  window.dispatchEvent(new Event(CART_EVENT));
}

export function CartQuantitiesProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<Record<string, number>>({});

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) return;
      const cart = (await res.json()) as Cart;
      setMap(Object.fromEntries(cart.lines.map((l) => [l.productId, l.quantity])));
    } catch {
      // offline: keep what we have
    }
  }, []);

  useEffect(() => {
    // Initial load, deferred so it isn't a synchronous state update inside the effect.
    const first = setTimeout(() => void reload(), 0);
    const onChange = () => void reload();
    window.addEventListener(CART_EVENT, onChange);
    window.addEventListener("focus", onChange);
    return () => {
      clearTimeout(first);
      window.removeEventListener(CART_EVENT, onChange);
      window.removeEventListener("focus", onChange);
    };
  }, [reload]);

  const value = useMemo<CartQuantities>(
    () => ({
      quantity: (id) => map[id] ?? 0,
      setQuantity: (id, q) =>
        setMap((m) => {
          const next = { ...m };
          if (q > 0) next[id] = q;
          else delete next[id];
          return next;
        }),
      reload,
    }),
    [map, reload],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** null outside the provider (e.g. admin pages) – callers then fall back to a plain button. */
export function useCartQuantities() {
  return useContext(Ctx);
}
