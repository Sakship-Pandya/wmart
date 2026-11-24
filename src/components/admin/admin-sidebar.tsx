import Link from "next/link";
import { ExternalLink, LogOut, Shield } from "lucide-react";
import type { AdminSession } from "@/lib/auth";
import { AdminNavLinks, type AdminNavBadge, type AdminNavHref } from "./admin-nav-links";

export interface AdminNavCounts {
  ordersToProcess: number;
  needsRestock: number;
}

export function AdminSidebar({ session, counts }: { session?: AdminSession | null; counts?: AdminNavCounts }) {
  // Orange = orders waiting for you, yellow = products to restock (same colours as the store).
  const badges: Partial<Record<AdminNavHref, AdminNavBadge>> = counts
    ? {
        "/admin/orders": { value: counts.ordersToProcess, label: "orders to process", tone: "bg-brand text-brand-foreground" },
        "/admin/products": { value: counts.needsRestock, label: "products need restocking", tone: "bg-star text-heading" },
      }
    : {};

  return (
    // print:!hidden – the sidebar is left out when printing a tax invoice.
    <aside className="hidden min-h-screen w-60 shrink-0 border-r bg-background p-4 md:flex md:flex-col md:justify-between print:!hidden">
      <div>
        <Link href="/admin" className="mb-7 flex items-center gap-2 px-2" aria-label="WMart admin dashboard">
          <span className="text-[26px] font-black tracking-tight text-heading">
            W<span className="text-brand">Mart</span>
          </span>
          <span className="rounded-full bg-heading px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-background">Admin</span>
        </Link>
        <AdminNavLinks badges={badges} />
      </div>

      <div className="space-y-3 border-t pt-4">
        <Link href="/" target="_blank" className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-brand">
          <ExternalLink className="size-3.5" />
          View store
        </Link>

        {session?.email && (
          <div className="flex items-center gap-2 px-1">
            <div className="flex size-8 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Shield className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-heading">{session.email}</p>
              <p className="text-[10px] text-muted-foreground">Admin</p>
            </div>
          </div>
        )}

        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="size-3.5" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
