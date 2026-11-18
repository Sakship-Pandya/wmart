import { Suspense } from "react";
import type { Metadata } from "next";
import { AccountHeading, AccountNav } from "@/components/shop/account/account-nav";
import { Skeleton } from "@/components/ui/skeleton";

// My account area: breadcrumbs + title on top, menu on the left, section on the right.
// TODO: redirect to /login when the customer is not signed in (once customer login exists).

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
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
