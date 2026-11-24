"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { register } from "@/server/actions/auth";
import { initialAuthState } from "@/lib/validation/auth";
import { Field, FormMessage, PasswordInput, TextInput, firstError } from "./form-parts";

/** `next` = page to return to after registering (e.g. /checkout). */
export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(register, initialAuthState);
  const emailError = firstError(state, "email");
  const passwordError = firstError(state, "password");

  return (
    <form action={action} noValidate className="space-y-3.5">
      <FormMessage state={state} />
      {next && <input type="hidden" name="next" value={next} />}
      <Field id="register-email" label="Email address" error={emailError}>
        <TextInput
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.values?.email}
          invalid={!!emailError}
        />
      </Field>
      <Field id="register-password" label="Password" error={passwordError}>
        <PasswordInput
          id="register-password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          invalid={!!passwordError}
        />
      </Field>
      {!passwordError && <p className="-mt-2.5 text-xs text-muted-foreground">At least 8 characters.</p>}

      {/* Anti-spam: hidden from people, bots fill it in. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          Leave this empty
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="h-10 w-full rounded-full bg-brand text-base font-semibold text-brand-foreground hover:bg-brand/85"
      >
        {pending ? "Creating account…" : "Register"}
      </Button>
    </form>
  );
}
