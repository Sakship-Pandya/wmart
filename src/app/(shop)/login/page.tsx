import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { AuthCard } from "@/components/shop/auth/auth-card";

export const metadata: Metadata = {
  title: "Log in or register",
  robots: { index: false, follow: true },
};

// Customer login. "Register" under the Log In button switches the card to the register form
// (same fields as the old site). The card is centred and kept compact so the form fits under the navbar.
export default function LoginPage() {
  return (
    <div className="space-y-3">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "My account" }]} />
      <h1 className="sr-only">My account</h1>
      <div className="flex justify-center">
        <AuthCard />
      </div>
    </div>
  );
}
