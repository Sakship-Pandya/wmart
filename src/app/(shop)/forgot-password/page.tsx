import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { ForgotPasswordForm } from "@/components/shop/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Lost password",
  robots: { index: false, follow: true },
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "My account", href: "/login" }, { label: "Lost password" }]}
        />
        <h1 className="text-3xl font-bold">Lost password</h1>
      </div>
      <section className="max-w-lg rounded-2xl border p-6 sm:p-8">
        <p className="mb-6 text-muted-foreground">
          Lost your password? Please enter your username or email address. You will receive a link to
          create a new password via email.
        </p>
        <ForgotPasswordForm />
        <p className="mt-6 text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Back to login
          </Link>
        </p>
      </section>
    </div>
  );
}
