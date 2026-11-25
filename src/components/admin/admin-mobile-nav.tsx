"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { AdminSession } from "@/lib/auth";
import { AdminLogo, AdminSidebarBody, type AdminNavCounts } from "./admin-sidebar-body";

/**
 * Phone top bar (below md): logo + ☰ button that slides in the same menu as the
 * desktop sidebar. The menu closes as soon as you open a page.
 */
export function AdminMobileNav({ session, counts }: { session?: AdminSession | null; counts?: AdminNavCounts }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the menu after navigating to another page.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const waiting = (counts?.ordersToProcess ?? 0) + (counts?.needsRestock ?? 0);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden print:!hidden">
      <AdminLogo />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          aria-label="Open admin menu"
          className="relative inline-flex size-10 items-center justify-center rounded-xl border hover:bg-muted"
        >
          <Menu className="size-5" />
          {waiting > 0 && (
            <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-brand px-1 text-center text-[10px] font-semibold leading-5 text-brand-foreground">
              {waiting}
              <span className="sr-only"> items need attention</span>
            </span>
          )}
        </SheetTrigger>
        <SheetContent side="left" className="w-72 overflow-y-auto p-4">
          <SheetTitle className="sr-only">Admin menu</SheetTitle>
          <AdminSidebarBody session={session} counts={counts} />
        </SheetContent>
      </Sheet>
    </header>
  );
}
