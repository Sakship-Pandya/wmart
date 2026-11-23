import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { WhatsAppButton } from "@/components/shop/whatsapp-button";

// Layout for every customer-facing page (store-UI developer).
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
      <Footer />
      {/* Space so the phone bottom bar never covers the end of the footer. */}
      <div className="h-14 lg:hidden" aria-hidden />
      <WhatsAppButton />
    </>
  );
}
