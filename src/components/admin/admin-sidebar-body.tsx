import Link from "next/link";
import { ExternalLink, LogOut, Shield } from "lucide-react";
import type { AdminSession } from "@/lib/auth";
import { AdminNavLinks, type AdminNavBadge, type AdminNavHref } from "./admin-nav-links";

export interface AdminNavCounts {
  ordersToProcess: number;
  needsRestock: number;
}

/** Orange = orders waiting for you, yellow = products to restock (same colours as the store). */
export function adminNavBadges(counts?: AdminNavCounts): Partial<Record<AdminNavHref, AdminNavBadge>> {
  return counts
    ? {
        "/admin/orders": { value: counts.ordersToProcess, label: "orders to process", tone: "bg-brand text-brand-foreground" },
        "/admin/products": { value: counts.needsRestock, label: "products need restocking", tone: "bg-star text-heading" },
      }
    : {};
}

export function AdminLogo() {
  return (
    <Link href="/admin" className="flex items-center gap-2 px-2" aria-label="WMart admin dashboard">
      <span className="text-[26px] font-black tracking-tight text-heading">
        W<span className="text-brand">Mart</span>
      </span>
      <span className="rounded-full bg-heading px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-background">Admin</span>
    </Link>
  );
}

/** Logo, page links and the account/sign-out block. Shared by the desktop sidebar and the phone menu. */
export function AdminSidebarBody({ session, counts }: { session?: AdminSession | null; counts?: AdminNavCounts }) {
  return (
    <div className="flex h-full flex-col justify-between gap-6">
      <div>
        <div className="mb-7">
          <AdminLogo />
        </div>
        <AdminNavLinks badges={adminNavBadges(counts)} />
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
    </div>
  );
}
