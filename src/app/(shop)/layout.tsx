import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";

// Layout for every customer-facing page (store-UI developer).
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
      <Footer />
    </>
  );
}
