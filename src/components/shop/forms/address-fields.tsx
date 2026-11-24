"use client";

import { Field, TextInput, firstError } from "@/components/shop/auth/form-parts";
import { indianStates, type FormState } from "@/lib/validation/forms";
import { cn } from "@/lib/utils";

const focusRing = "focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/20";

/**
 * Indian address fields (name, mobile, address lines, city, pincode, state), named "<prefix>.<field>".
 * Used by checkout and by My account → Addresses. Values come from the last submit, else `initial`.
 */
export function AddressFields({
  prefix,
  state,
  initial,
}: {
  prefix: "shipping" | "billing";
  state: FormState;
  initial?: Partial<Record<"fullName" | "phone" | "line1" | "line2" | "city" | "state" | "pincode", string>>;
}) {
  const err = (f: string) => firstError(state, `${prefix}.${f}`);
  const val = (f: keyof NonNullable<typeof initial>) => state.values?.[`${prefix}.${f}`] ?? initial?.[f];
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
