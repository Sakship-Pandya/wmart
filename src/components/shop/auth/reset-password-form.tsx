"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { resetPassword } from "@/server/actions/auth";
import { initialAuthState } from "@/lib/validation/auth";
import { Field, FormMessage, PasswordInput, firstError } from "./form-parts";

/** New password + confirmation for a reset link. On success the server signs the customer in. */
export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, initialAuthState);
  const passwordError = firstError(state, "password");
  const confirmError = firstError(state, "confirm");
  return (
    <form action={action} noValidate className="space-y-3.5">
      <FormMessage state={state} />
      <input type="hidden" name="token" value={token} />
      <Field id="new-password" label="New password" error={passwordError}>
        <PasswordInput id="new-password" name="password" autoComplete="new-password" required invalid={!!passwordError} />
      </Field>
      <Field id="confirm-password" label="Repeat new password" error={confirmError}>
        <PasswordInput id="confirm-password" name="confirm" autoComplete="new-password" required invalid={!!confirmError} />
      </Field>
      <Button type="submit" disabled={pending} className="h-10 w-full rounded-full text-base font-semibold">
        {pending ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}
