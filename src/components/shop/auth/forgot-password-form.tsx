"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "@/server/actions/auth";
import { initialAuthState } from "@/lib/validation/auth";
import { Field, FormMessage, TextInput, firstError } from "./form-parts";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initialAuthState);
  const error = firstError(state, "email");
  return (
    <form action={action} noValidate className="space-y-3.5">
      <FormMessage state={state} />
      <Field id="reset-email" label="Email address" error={error}>
        <TextInput
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.values?.email}
          invalid={!!error}
        />
      </Field>
      <Button type="submit" disabled={pending} className="h-10 w-full rounded-full text-base font-semibold">
        {pending ? "Sending…" : "Reset password"}
      </Button>
    </form>
  );
}
