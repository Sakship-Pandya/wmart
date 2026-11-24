"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { login } from "@/server/actions/auth";
import { initialAuthState } from "@/lib/validation/auth";
import { Field, FormMessage, PasswordInput, TextInput, firstError } from "./form-parts";

/** `next` = page to return to after logging in (e.g. /checkout). */
export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, initialAuthState);
  const emailError = firstError(state, "email");
  const passwordError = firstError(state, "password");

  return (
    <form action={action} noValidate className="space-y-3.5">
      <FormMessage state={state} />
      {next && <input type="hidden" name="next" value={next} />}
      <Field id="login-email" label="Email address" error={emailError}>
        <TextInput
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.values?.email}
          invalid={!!emailError}
        />
      </Field>
      <Field id="login-password" label="Password" error={passwordError}>
        <PasswordInput
          id="login-password"
          name="password"
          autoComplete="current-password"
          required
          invalid={!!passwordError}
        />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <label className="flex cursor-pointer items-center gap-2 text-heading">
          <input type="checkbox" name="rememberMe" className="size-4 accent-brand" />
          Remember me
        </label>
        <Link href="/forgot-password" className="font-medium text-brand hover:underline">
          Lost your password?
        </Link>
      </div>

      <Button type="submit" disabled={pending} className="h-10 w-full rounded-full text-base font-semibold">
        {pending ? "Logging in…" : "Log In"}
      </Button>
    </form>
  );
}
