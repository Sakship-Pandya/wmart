"use client";

import { useActionState, useState } from "react";
import { Banknote, CreditCard, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormMessage, TextInput, firstError } from "@/components/shop/auth/form-parts";
import { AddressFields } from "@/components/shop/forms/address-fields";
import { placeOrder } from "@/server/actions/checkout";
import { initialFormState } from "@/lib/validation/forms";
import { cn } from "@/lib/utils";

const focusRing = "focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/20";

const paymentOptions = [
  {
    value: "payu",
    title: "Pay online",
    detail: "UPI, debit/credit card, netbanking or wallets – secured by PayU.",
    icon: CreditCard,
  },
  {
    value: "cod",
    title: "Cash on Delivery",
    detail: "Pay in cash when Delhivery delivers your order.",
    icon: Banknote,
  },
] as const;

type SavedAddress = Parameters<typeof AddressFields>[0]["initial"];

/** `initial` = signed-in customer's email and saved addresses (from My account), used to prefill the form. */
export function CheckoutForm({ initial }: { initial?: { email?: string; shipping?: SavedAddress; billing?: SavedAddress; billingDiffers?: boolean } }) {
  const [state, action, pending] = useActionState(placeOrder, initialFormState);
  const [billingSame, setBillingSame] = useState(!initial?.billingDiffers);
  const [payment, setPayment] = useState<string>("payu");
  const err = (f: string) => firstError(state, f);

  return (
    <form action={action} noValidate className="space-y-6">
      <FormMessage state={state} />

      <section className="space-y-3.5">
        <h2 className="text-lg font-bold">Contact</h2>
        <Field id="checkout-email" label="Email address" error={err("email")}>
          <TextInput id="checkout-email" name="email" type="email" autoComplete="email" defaultValue={state.values?.email ?? initial?.email} invalid={!!err("email")} />
        </Field>
        <p className="-mt-2 text-xs text-muted-foreground">We&apos;ll send your order confirmation and GST invoice here.</p>
      </section>

      <section className="space-y-3.5">
        <h2 className="text-lg font-bold">Shipping address</h2>
        <AddressFields prefix="shipping" state={state} initial={initial?.shipping} />
      </section>

      <section className="space-y-3.5">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-heading">
          <input
            type="checkbox"
            name="billingSameAsShipping"
            checked={billingSame}
            onChange={(e) => setBillingSame(e.target.checked)}
            className="size-4 accent-brand"
          />
          Billing address is the same as shipping address
        </label>
        {!billingSame && (
          <div className="space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-300 motion-reduce:animate-none">
            <h2 className="text-lg font-bold">Billing address</h2>
            <AddressFields prefix="billing" state={state} initial={initial?.billing} />
          </div>
        )}
      </section>

      <section className="space-y-3.5">
        <h2 className="text-lg font-bold">Payment</h2>
        <div role="radiogroup" aria-label="Payment method" className="grid gap-3 sm:grid-cols-2">
          {paymentOptions.map((o) => (
            <label
              key={o.value}
              className={cn(
                "flex cursor-pointer gap-3 rounded-2xl border p-4 transition",
                payment === o.value ? "border-brand bg-brand/5" : "hover:border-foreground/20",
              )}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={o.value}
                checked={payment === o.value}
                onChange={() => setPayment(o.value)}
                className="mt-1 size-4 accent-brand"
              />
              <span>
                <span className="flex items-center gap-2 font-semibold text-heading">
                  <o.icon className="size-4 text-brand" />
                  {o.title}
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{o.detail}</span>
              </span>
            </label>
          ))}
        </div>
        {err("paymentMethod") && <p className="text-sm text-destructive">{err("paymentMethod")}</p>}
      </section>

      <section className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium text-heading">
          Order notes <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={500}
          placeholder="Notes about your order, e.g. special delivery instructions."
          defaultValue={state.values?.notes}
          className={cn("rounded-2xl px-4 py-3", focusRing)}
        />
      </section>

      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-full bg-brand text-base font-semibold text-brand-foreground hover:bg-brand/85"
      >
        <Lock data-icon="inline-start" />
        {pending ? "Placing order…" : payment === "cod" ? "Place order" : "Continue to payment"}
      </Button>
    </form>
  );
}
