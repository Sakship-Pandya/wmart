import type { AdminSession } from "@/lib/auth";
import { AdminSidebarBody, type AdminNavCounts } from "./admin-sidebar-body";

export type { AdminNavCounts };

/** Desktop / tablet sidebar (md and up). Phones use AdminMobileNav instead. */
export function AdminSidebar({ session, counts }: { session?: AdminSession | null; counts?: AdminNavCounts }) {
  return (
    // print:!hidden – the sidebar is left out when printing a tax invoice.
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 overflow-y-auto border-r bg-background p-4 md:block print:!hidden">
      <AdminSidebarBody session={session} counts={counts} />
    </aside>
  );
}
