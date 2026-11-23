"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

// The year is filled in by the browser only (the server renders nothing for it),
// so pages with the footer can still be pre-built.
export function CurrentYear() {
  const year = useSyncExternalStore(noop, () => new Date().getFullYear(), () => null);
  return <>{year}</>;
}
