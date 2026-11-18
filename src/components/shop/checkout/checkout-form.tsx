"use client";

import { useActionState, useState } from "react";
import { Banknote, CreditCard, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormMessage, TextInput, firstError } from "@/components/shop/auth/form-parts";
import { placeOrder } from "@/server/actions/checkout";
import { indianStates, initialFormState, type FormState } from "@/lib/validation/forms";
import { cn } from "@/lib/utils";

const focusRing = "focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/20";

function AddressFields({ prefix, state }: { prefix: "shipping" | "billing"; state: FormState }) {
  const err = (f: string) => firstError(state, `${prefix}.${f}`);
  const val = (f: string) => state.values?.[`${prefix}.${f}`];
  const id = (f: string) => `${prefix}-${f}`;
  const ac = prefix === "shipping" ? "shipping" : "billing";
  return (
    <div className="grid gap-3.5 sm:grid-cols-2">
      <Field id={id("fullName")} label="Full name" error={err("fullName")}>
        <TextInput id={id("fullName")} name={`${prefix}.fullName`} autoComplete={`${ac} name`} defaultValue={val("fullName")} invalid={!!err("fullName")} />
      </Field>
      <Field id={id("phone")} label="Mobile number" error={err("phone")}>
        <TextInput id={id("phone")} name={`${prefix}.phone`} type="tel" inputMode="tel" autoComplete={`${ac} tel`} placeholder="10-digit mobile" defaultValue={val("phone")} invalid={!!err("phone")} />
      </Field>
      <Field id={id("line1")} label="House no., building, street" error={err("line1")} className="sm:col-span-2">
        <TextInput id={id("line1")} name={`${prefix}.line1`} autoComplete={`${ac} address-line1`} defaultValue={val("line1")} invalid={!!err("line1")} />
      </Field>
      <Field id={id("line2")} label="Area, landmark" optional error={err("line2")} className="sm:col-span-2">
        <TextInput id={id("line2")} name={`${prefix}.line2`} autoComplete={`${ac} address-line2`} defaultValue={val("line2")} invalid={!!err("line2")} />
      </Field>
      <Field id={id("city")} label="Town / city" error={err("city")}>
        <TextInput id={id("city")} name={`${prefix}.city`} autoComplete={`${ac} address-level2`} defaultValue={val("city")} invalid={!!err("city")} />
      </Field>
      <Field id={id("pincode")} label="Pincode" error={err("pincode")}>
        <TextInput id={id("pincode")} name={`${prefix}.pincode`} inputMode="numeric" autoComplete={`${ac} postal-code`} maxLength={6} defaultValue={val("pincode")} invalid={!!err("pincode")} />
      </Field>
      <Field id={id("state")} label="State" error={err("state")} className="sm:col-span-2">
        <select
          id={id("state")}
          name={`${prefix}.state`}
          autoComplete={`${ac} address-level1`}
          defaultValue={val("state") ?? ""}
          aria-invalid={!!err("state") || undefined}
          aria-describedby={err("state") ? `${id("state")}-error` : undefined}
          className={cn("h-10 w-full rounded-full border border-input bg-transparent px-4 text-sm outline-none aria-invalid:border-destructive", focusRing)}
        >
          <option value="" disabled>Choose a state</option>
          {indianStates.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Field>
    </div>
  );
}

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

export function CheckoutForm() {
  const [state, action, pending] = useActionState(placeOrder, initialFormState);
  const [billingSame, setBillingSame] = useState(true);
  const [payment, setPayment] = useState<string>("payu");
  const err = (f: string) => firstError(state, f);

  return (
    <form action={action} noValidate className="space-y-6">
      <FormMessage state={state} />

      <section className="space-y-3.5">
        <h2 className="text-lg font-bold">Contact</h2>
        <Field id="checkout-email" label="Email address" error={err("email")}>
          <TextInput id="checkout-email" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} invalid={!!err("email")} />
        </Field>
        <p className="-mt-2 text-xs text-muted-foreground">We&apos;ll send your order confirmation and GST invoice here.</p>
      </section>

      <section className="space-y-3.5">
        <h2 className="text-lg font-bold">Shipping address</h2>
        <AddressFields prefix="shipping" state={state} />
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
            <AddressFields prefix="billing" state={state} />
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
