import { Suspense } from "react";
import type { Metadata } from "next";
import { AccountHeading, AccountNav } from "@/components/shop/account/account-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { requireCustomer } from "@/lib/customer-session";

// My account area: breadcrumbs + title on top, menu on the left, section on the right.
// Signed-out visitors are sent to /login (and come back here after logging in).

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <div className="space-y-8">
      <Suspense fallback={<Skeleton className="h-16 w-64" />}>
        <AccountHeading />
      </Suspense>
      <div className="grid gap-8 md:grid-cols-[260px_1fr]">
        <aside>
          <Suspense fallback={<Skeleton className="h-80 rounded-2xl" />}>
            <AccountNav />
          </Suspense>
        </aside>
        <section className="min-w-0">
          <Suspense fallback={<Skeleton className="h-48 rounded-2xl" />}>
            <AccountGate>{children}</AccountGate>
          </Suspense>
        </section>
      </div>
    </div>
  );
}

// Checks the customer login on every request before showing any account page.
async function AccountGate({ children }: { children: React.ReactNode }) {
  await requireCustomer("/account");
  return <>{children}</>;
}
