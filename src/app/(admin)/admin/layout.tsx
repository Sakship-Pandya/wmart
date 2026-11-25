import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { requireAdmin, getAdminSession } from "@/lib/auth";
import { getAdminNavCounts } from "@/server/queries/admin/dashboard";

// Layout for every /admin page (admin-panel developer).
// Lives in its own route group, so the store header/footer are not shown here.

// Admin panel reads session cookies at request time.
export const instant = false;

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  // If user is not authenticated, render clean centered page without sidebar (for /admin/login)
  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        {children}
      </div>
    );
  }

  // Badge counts on the sidebar (orders to process, products to restock).
  const counts = await getAdminNavCounts().catch(() => undefined);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Phones: top bar with a ☰ menu. Tablets and up: the sidebar. */}
      <AdminMobileNav session={session} counts={counts} />
      <AdminSidebar session={session} counts={counts} />
      {/* min-w-0 lets the content area shrink to the screen width; without it a wide
          table pushes the whole page sideways instead of scrolling inside its own box. */}
      <main className="min-w-0 flex-1 bg-muted/30 p-4 sm:p-6 print:bg-white print:p-0">
        <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
          <AdminGate>{children}</AdminGate>
        </Suspense>
      </main>
    </div>
  );
}

// Checks the admin login on every request before showing any admin page.
async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
