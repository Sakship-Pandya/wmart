"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { endTabSession } from "@/server/actions/auth";

// Logins without "Remember me" end when the customer closes their last WMart tab.
//
// Browsers keep session cookies until the WHOLE browser closes, and a page can't be told reliably
// that a tab was closed. So instead: each tab that belongs to the login remembers that in
// sessionStorage (which dies with the tab). When a page opens without that mark, it asks the other
// WMart tabs over a BroadcastChannel; if none answers, every tab was closed – sign out.
// The readable cookie wmart_tab_session ("new" right after login, then "1") is set by the server
// only for "this tab only" logins, so "Remember me" logins are never touched.

const COOKIE = "wmart_tab_session";
const MARK = "wmart_tab_session_alive";
const CHANNEL = "wmart-tab-session";
const WAIT_MS = 400;

function readCookie(): string | null {
  const hit = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE}=`));
  return hit ? decodeURIComponent(hit.slice(COOKIE.length + 1)) : null;
}

export function TabSessionGuard() {
  const router = useRouter();
  // Re-checked on every page change: logging in happens inside the tab (no reload), so the
  // tab must claim the fresh "new" login on the page it lands on.
  const pathname = usePathname();

  useEffect(() => {
    const mode = readCookie();
    if (!mode || typeof BroadcastChannel === "undefined") return;

    let alive = false;
    let heardOtherTab = false;
    const channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (e) => {
      if (e.data === "ping" && alive) channel.postMessage("pong");
      if (e.data === "pong") heardOtherTab = true;
    };
    const claim = () => {
      alive = true;
      try {
        sessionStorage.setItem(MARK, "1");
      } catch {
        // storage blocked: this tab still answers pings while it is open
      }
    };

    let markedHere = false;
    try {
      markedHere = sessionStorage.getItem(MARK) === "1";
    } catch {
      markedHere = false;
    }

    if (mode === "new" || markedHere) {
      // This tab logged in (or already belongs to the login, e.g. after a reload).
      claim();
      if (mode === "new") document.cookie = `${COOKIE}=1; path=/; samesite=lax`;
      return () => channel.close();
    }

    // A new tab: is any other tab of this login still open?
    channel.postMessage("ping");
    const timer = setTimeout(async () => {
      if (heardOtherTab) {
        claim();
        return;
      }
      await endTabSession();
      router.refresh();
    }, WAIT_MS);

    return () => {
      clearTimeout(timer);
      channel.close();
    };
  }, [router, pathname]);

  return null;
}
