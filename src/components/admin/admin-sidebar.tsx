import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Layers,
  Tag,
  ShoppingBag,
  Upload,
  Users,
  TicketPercent,
  LogOut,
  Shield,
} from "lucide-react";
import type { AdminSession } from "@/lib/auth";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Layers },
  { href: "/admin/brands", label: "Brands", icon: Tag },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/admin/import", label: "Bulk import", icon: Upload },
] as const;

export function AdminSidebar({ session }: { session?: AdminSession | null }) {
  return (
    <aside className="hidden w-56 shrink-0 border-r bg-background p-4 md:flex md:flex-col md:justify-between min-h-screen">
      <div>
        <Link href="/admin" className="mb-6 block text-lg font-bold">
          WMart Admin
        </Link>
        <nav className="space-y-1">
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="pt-4 border-t space-y-3">
        {session?.email && (
          <div className="flex items-center gap-2 px-1">
            <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Shield className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{session.email}</p>
              <p className="text-[10px] text-muted-foreground">Admin</p>
            </div>
          </div>
        )}

        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-colors"
          >
            <LogOut className="size-3.5" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
