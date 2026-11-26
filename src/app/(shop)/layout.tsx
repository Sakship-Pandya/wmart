import { Suspense } from "react";
import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { WhatsAppButton } from "@/components/shop/whatsapp-button";
import { TabSessionGuard } from "@/components/shop/tab-session-guard";
import { CartQuantitiesProvider } from "@/components/shop/cart/cart-quantities";

// Layout for every customer-facing page (store-UI developer).
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    // CartQuantitiesProvider: product cards know what's in the cart (Add To Cart → − 2 + counter).
    <CartQuantitiesProvider>
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
      <Footer />
      {/* Space so the phone bottom bar never covers the end of the footer. */}
      <div className="h-14 lg:hidden" aria-hidden />
      <WhatsAppButton />
      {/* Suspense: the guard reads the URL (usePathname), which needs a boundary under Cache Components. */}
      <Suspense fallback={null}>
        <TabSessionGuard />
      </Suspense>
    </CartQuantitiesProvider>
  );
}
