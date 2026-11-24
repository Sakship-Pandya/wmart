"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/shop/auth/form-parts";
import { saveAddress } from "@/server/actions/forms";
import { initialFormState } from "@/lib/validation/forms";
import { AddressFields } from "./address-fields";

type Initial = Parameters<typeof AddressFields>[0]["initial"];

/** My account → Addresses → Add / Edit (billing or shipping). */
export function AddressForm({ type, initial }: { type: "billing" | "shipping"; initial?: Initial }) {
  const [state, action, pending] = useActionState(saveAddress, initialFormState);
  return (
    <form action={action} noValidate className="max-w-2xl space-y-5">
      <FormMessage state={state} />
      <input type="hidden" name="type" value={type} />
      <AddressFields prefix={type} state={state} initial={initial} />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} className="h-10 rounded-full px-6 text-base font-semibold">
          {pending ? "Saving…" : "Save address"}
        </Button>
        <Link href="/account/addresses" className="text-sm font-medium text-muted-foreground hover:text-brand">
          Cancel
        </Link>
      </div>
    </form>
  );
}
