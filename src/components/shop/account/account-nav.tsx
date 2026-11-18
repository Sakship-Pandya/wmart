"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { accountSections } from "./account-sections";

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
    <nav aria-label="My account" className="rounded-2xl bg-muted p-3">
      <ul className="space-y-1">
        {accountSections.map((s) => {
          const isActive = s.href === active.href;
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "block rounded-xl px-4 py-2.5 font-medium text-heading transition-colors hover:bg-accent",
                  isActive && "bg-accent",
                )}
              >
                {s.label}
              </Link>
            </li>
          );
        })}
        <li>
          {/* TODO: sign the customer out once customer login exists. */}
          <Link href="/login" className="block rounded-xl px-4 py-2.5 font-medium text-heading hover:bg-accent">
            Logout
          </Link>
        </li>
      </ul>
    </nav>
  );
}
