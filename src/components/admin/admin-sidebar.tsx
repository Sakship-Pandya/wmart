import Link from "next/link";
import { LayoutDashboard, Package, ShoppingBag, Upload, Users, TicketPercent } from "lucide-react";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/admin/import", label: "Bulk import", icon: Upload },
] as const;

export function AdminSidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r bg-background p-4 md:block">
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
    </aside>
  );
}
