import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { ResetPasswordForm } from "@/components/shop/auth/reset-password-form";
import { Skeleton } from "@/components/ui/skeleton";
import { customerForResetToken } from "@/lib/password-reset";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

// Opened from the link in the password reset email: /reset-password?token=…
export default function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "My account", href: "/login" }, { label: "New password" }]} />
        <h1 className="text-3xl font-bold">Choose a new password</h1>
      </div>
      <section className="max-w-lg rounded-2xl border p-6 sm:p-8">
        <Suspense fallback={<Skeleton className="h-48 rounded-2xl" />}>
          <ResetBody searchParams={searchParams} />
        </Suspense>
      </section>
    </div>
  );
}

async function ResetBody({ searchParams }: { searchParams: PageProps<"/reset-password">["searchParams"] }) {
  const raw = (await searchParams).token;
  const token = typeof raw === "string" ? raw : "";
  const customer = token ? await customerForResetToken(token) : null;
  if (!customer) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">This reset link has expired or was already used.</p>
        <Link href="/forgot-password" className="inline-block font-medium text-brand hover:underline">
          Ask for a new link →
        </Link>
      </div>
    );
  }
  return (
    <>
      <p className="mb-6 text-muted-foreground">
        Setting a new password for <strong className="text-heading">{customer.email}</strong>. Use at least 8 characters.
      </p>
      <ResetPasswordForm token={token} />
    </>
  );
}
