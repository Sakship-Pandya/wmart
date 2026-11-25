"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type Result =
  | { configured: false }
  | { configured: true; serviceable: boolean; cod: boolean; city?: string }
  | { error: string };

/** "Check delivery" box on the product page – asks Delhivery whether it delivers to a pincode. */
export function PincodeCheck() {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[1-9]\d{5}$/.test(pin)) {
      setResult({ error: "Enter a 6-digit pincode." });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/pincode?pin=${pin}`);
      setResult((await res.json()) as Result);
    } catch {
      setResult({ error: "Couldn't check right now – please try again." });
    } finally {
      setBusy(false);
    }
  }

  let message: { text: string; ok: boolean } | null = null;
  if (result) {
    if ("error" in result) message = { text: result.error, ok: false };
    else if (!result.configured) message = { text: "We deliver across India with Delhivery – free shipping on every order.", ok: true };
    else if (!result.serviceable) message = { text: "Sorry, Delhivery doesn't deliver to this pincode yet. Message us on WhatsApp for options.", ok: false };
    else
      message = {
        text: `Delivers to ${result.city ? `${result.city} ` : ""}(${pin}) · Free shipping${result.cod ? " · Cash on Delivery available" : " · Prepaid only (no Cash on Delivery)"}`,
        ok: true,
      };
  }

  return (
    <div className="space-y-2 rounded-xl border p-3">
      <form onSubmit={check} className="flex items-center gap-2">
        <MapPin className="size-4 shrink-0 text-brand" aria-hidden />
        <label htmlFor="pincode-check" className="sr-only">
          Delivery pincode
        </label>
        <input
          id="pincode-check"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          placeholder="Enter pincode to check delivery"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, ""));
            setResult(null);
          }}
          className="h-9 min-w-0 flex-1 rounded-full border bg-background px-3 text-sm outline-none focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/20"
        />
        <button
          type="submit"
          disabled={busy}
          className="h-9 shrink-0 rounded-full border px-4 text-sm font-semibold text-heading transition hover:border-brand hover:text-brand disabled:opacity-60"
        >
          {busy ? "Checking…" : "Check"}
        </button>
      </form>
      {message && (
        <p aria-live="polite" className={cn("text-xs", message.ok ? "text-success" : "text-destructive")}>
          {message.text}
        </p>
      )}
    </div>
  );
}
