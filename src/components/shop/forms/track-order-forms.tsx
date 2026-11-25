"use client";

import { useActionState, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, TextInput, firstError } from "@/components/shop/auth/form-parts";
import { lookupOrder } from "@/server/actions/forms";
import { initialFormState } from "@/lib/validation/forms";
import { delhiveryAwbUrl } from "@/lib/site";

/** Same orange button for both tracking forms; mt-auto keeps it at the bottom of its card. */
const submitClass = "mt-auto h-10 w-full rounded-full bg-brand text-base font-semibold text-brand-foreground hover:bg-brand/85";

/** Opens Delhivery's tracking page for the AWB number in a new tab. */
export function AwbTrackingForm() {
  const [awb, setAwb] = useState("");
  const [error, setError] = useState<string>();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = awb.replace(/\s/g, "");
    if (!/^\d{8,20}$/.test(value)) {
      setError("Enter the tracking number (AWB) – digits only, from your shipping SMS or email.");
      return;
    }
    setError(undefined);
    window.open(delhiveryAwbUrl(value), "_blank", "noopener,noreferrer");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col gap-3.5">
      <Field id="awb" label="Delhivery tracking number (AWB)" error={error}>
        <TextInput
          id="awb"
          name="awb"
          inputMode="numeric"
          autoComplete="off"
          placeholder="e.g. 1234567890123"
          value={awb}
          onChange={(e) => setAwb(e.target.value)}
          invalid={!!error}
        />
      </Field>
      <Button type="submit" className={submitClass}>
        Track on Delhivery
        <ExternalLink data-icon="inline-end" />
      </Button>
    </form>
  );
}

/** Looks up an order by order number + email/mobile (needs the Order table – see lookupOrder). */
export function OrderLookupForm() {
  const [state, action, pending] = useActionState(lookupOrder, initialFormState);
  const err = (f: string) => firstError(state, f);
  return (
    <form action={action} noValidate className="flex flex-1 flex-col gap-3.5">
      <FormMessage state={state} />
      <Field id="order-number" label="Order number" error={err("orderNumber")}>
        <TextInput id="order-number" name="orderNumber" placeholder="e.g. WM10234" defaultValue={state.values?.orderNumber} invalid={!!err("orderNumber")} />
      </Field>
      <Field id="order-contact" label="Email or mobile number used for the order" error={err("contact")}>
        <TextInput id="order-contact" name="contact" autoComplete="email" defaultValue={state.values?.contact} invalid={!!err("contact")} />
      </Field>
      <Button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Looking up…" : "Find my order"}
      </Button>
    </form>
  );
}
