"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { accountSections } from "./account-sections";
import { logout } from "@/server/actions/auth";

function useActiveSection() {
  const segment = useSelectedLayoutSegment();
  return accountSections.find((s) => s.segment === segment) ?? accountSections[0];
}

/** Breadcrumbs + page title above the account area. */
export function AccountHeading() {
  const active = useActiveSection();
  const crumbs =
    active.segment === null
      ? [{ label: "Home", href: "/" }, { label: "My account" }]
      : [{ label: "Home", href: "/" }, { label: "My account", href: "/account" }, { label: active.label }];
  return (
    <div className="space-y-3">
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold">{active.segment === null ? "My account" : active.label}</h1>
    </div>
  );
}

/** Left-hand menu. Highlights the section you are on. */
export function AccountNav() {
  const active = useActiveSection();
  return (
    // Phones: a rounded card. md+: plain list inside the full-height side panel (see account layout).
    <nav aria-label="My account" className="rounded-2xl bg-muted p-3 md:rounded-none md:bg-transparent md:p-0">
      <ul className="space-y-1">
        {accountSections.map((s) => {
          const isActive = s.href === active.href;
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "block rounded-xl px-4 py-2.5 font-medium text-heading transition-colors hover:bg-accent md:hover:bg-background",
                  isActive && "bg-accent md:bg-background md:text-brand md:shadow-sm",
                )}
              >
                {s.label}
              </Link>
            </li>
          );
        })}
        <li className="md:mt-2 md:border-t md:pt-2">
          <form action={logout}>
            <button type="submit" className="block w-full cursor-pointer rounded-xl px-4 py-2.5 text-left font-medium text-heading hover:bg-accent hover:text-destructive md:hover:bg-background">
              Logout
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
