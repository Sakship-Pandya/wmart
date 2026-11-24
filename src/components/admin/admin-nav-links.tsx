"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  Tag,
  ShoppingBag,
  Upload,
  Users,
  TicketPercent,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Layers },
  { href: "/admin/brands", label: "Brands", icon: Tag },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/admin/import", label: "Bulk import", icon: Upload },
] as const;

export type AdminNavHref = (typeof adminNavItems)[number]["href"];
export type AdminNavBadge = { value: number; label: string; tone: string };

/** Sidebar links; the page you are on is highlighted in WMart orange (like the store's account menu). */
export function AdminNavLinks({ badges }: { badges: Partial<Record<AdminNavHref, AdminNavBadge>> }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="space-y-1">
      {adminNavItems.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
        const badge = badges[href];
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors",
              active ? "bg-brand/10 font-semibold text-brand" : "text-heading hover:bg-muted",
            )}
          >
            <Icon className="size-4" />
            <span className="flex-1">{label}</span>
            {badge && badge.value > 0 && (
              <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none", badge.tone)} title={`${badge.value} ${badge.label}`}>
                {badge.value}
                <span className="sr-only"> {badge.label}</span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
