"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Copies a coupon code to the clipboard and briefly says so. */
export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          // Clipboard blocked (e.g. http or old browser): the code is visible to copy by hand.
        }
      }}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm font-medium text-heading transition hover:border-brand hover:text-brand"
      aria-label={`Copy code ${code}`}
    >
      {copied ? <Check className="size-4 text-success" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {copied ? "Copied" : "Copy code"}
    </button>
  );
}
