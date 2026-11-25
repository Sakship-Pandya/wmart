import { Suspense } from "react";
import type { Metadata } from "next";
import { AccountHeading, AccountNav } from "@/components/shop/account/account-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { requireCustomer } from "@/lib/customer-session";

// My account area. From tablet width up, the menu is a full-height panel attached to the left
// edge of the screen (header to footer); the title and the section sit to its right.
// On phones it stacks: title, menu, section.
// Signed-out visitors are sent to /login (and come back here after logging in).

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    // md: negative margins cancel <main>'s padding and the footer's top margin so the panel touches both;
    // ml-[calc(50%-50vw)] stretches it out of the centred container to the screen's left edge.
    <div className="grid gap-6 md:-mt-6 md:-mb-[5.5rem] md:ml-[calc(50%-50vw)] md:min-h-[calc(100vh-12rem)] md:grid-cols-[17rem_1fr] md:grid-rows-[auto_1fr] md:gap-x-10 md:gap-y-8 lg:grid-cols-[19rem_1fr]">
      <div className="md:col-start-2 md:pt-8">
        <Suspense fallback={<Skeleton className="h-16 w-64" />}>
          <AccountHeading />
        </Suspense>
      </div>
      <aside className="md:col-start-1 md:row-span-2 md:row-start-1 md:border-r md:bg-muted/60">
        <div className="md:sticky md:top-0 md:px-4 md:py-8">
          <Suspense fallback={<Skeleton className="h-80 rounded-2xl" />}>
            <AccountNav />
          </Suspense>
        </div>
      </aside>
      <section className="min-w-0 md:col-start-2 md:pb-20">
        <Suspense fallback={<Skeleton className="h-48 rounded-2xl" />}>
          <AccountGate>{children}</AccountGate>
        </Suspense>
      </section>
    </div>
  );
}

// Checks the customer login on every request before showing any account page.
async function AccountGate({ children }: { children: React.ReactNode }) {
  await requireCustomer("/account");
  return <>{children}</>;
}
