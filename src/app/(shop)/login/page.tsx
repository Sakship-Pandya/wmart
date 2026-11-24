import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { AuthCard } from "@/components/shop/auth/auth-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentCustomer, safeNext } from "@/lib/customer-session";

export const metadata: Metadata = {
  title: "Log in or register",
  robots: { index: false, follow: true },
};

// Customer login. "Register" under the Log In button switches the card to the register form.
// ?next=/checkout sends the customer back there after logging in; already signed-in customers go straight on.
export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="space-y-3">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "My account" }]} />
      <h1 className="sr-only">My account</h1>
      <div className="flex justify-center">
        <Suspense fallback={<Skeleton className="h-[460px] w-full max-w-md rounded-3xl" />}>
          <LoginContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function LoginContent({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { next } = await searchParams;
  const target = safeNext(next, "/");
  if (await getCurrentCustomer()) redirect(target);
  return <AuthCard next={target === "/" ? undefined : target} />;
}
