"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, PasswordInput, TextInput, firstError } from "@/components/shop/auth/form-parts";
import { updateAccountDetails } from "@/server/actions/forms";
import { initialFormState } from "@/lib/validation/forms";

// My account → Account details (same fields as the old site).
// Starts with the signed-in customer's saved details; after saving it shows what was saved.
export type AccountDetailsInitial = { firstName: string; lastName: string; displayName: string; email: string };

export function AccountDetailsForm({ initial }: { initial: AccountDetailsInitial }) {
  const [state, action, pending] = useActionState(updateAccountDetails, initialFormState);
  const err = (f: string) => firstError(state, f);
  const v = state.values ?? initial;
  return (
    <form action={action} noValidate className="max-w-2xl space-y-3.5">
      <FormMessage state={state} />
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field id="first-name" label="First name" error={err("firstName")}>
          <TextInput id="first-name" name="firstName" autoComplete="given-name" defaultValue={v?.firstName} invalid={!!err("firstName")} />
        </Field>
        <Field id="last-name" label="Last name" error={err("lastName")}>
          <TextInput id="last-name" name="lastName" autoComplete="family-name" defaultValue={v?.lastName} invalid={!!err("lastName")} />
        </Field>
      </div>
      <Field id="display-name" label="Display name" error={err("displayName")}>
        <TextInput id="display-name" name="displayName" autoComplete="nickname" defaultValue={v?.displayName} invalid={!!err("displayName")} />
      </Field>
      <p className="-mt-2 text-xs text-muted-foreground">This is how your name appears in your account and in reviews.</p>
      <Field id="account-email" label="Email address" error={err("email")}>
        <TextInput id="account-email" name="email" type="email" autoComplete="email" defaultValue={v?.email} invalid={!!err("email")} />
      </Field>

      <fieldset className="space-y-3.5 rounded-2xl border p-5">
        <legend className="px-2 font-semibold text-heading">Password change</legend>
        <p className="text-sm text-muted-foreground">Leave these blank to keep your current password. Your current password is also needed to change your email address.</p>
        <Field id="current-password" label="Current password" optional error={err("currentPassword")}>
          <PasswordInput id="current-password" name="currentPassword" autoComplete="current-password" invalid={!!err("currentPassword")} />
        </Field>
        <Field id="new-password" label="New password" optional error={err("newPassword")}>
          <PasswordInput id="new-password" name="newPassword" autoComplete="new-password" invalid={!!err("newPassword")} />
        </Field>
        <Field id="confirm-password" label="Confirm new password" optional error={err("confirmPassword")}>
          <PasswordInput id="confirm-password" name="confirmPassword" autoComplete="new-password" invalid={!!err("confirmPassword")} />
        </Field>
      </fieldset>

      <Button type="submit" disabled={pending} className="h-10 rounded-full px-6 text-base font-semibold">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
