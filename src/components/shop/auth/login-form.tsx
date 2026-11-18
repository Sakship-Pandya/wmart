"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { login } from "@/server/actions/auth";
import { initialAuthState } from "@/lib/validation/auth";
import { Field, FormMessage, PasswordInput, TextInput, firstError } from "./form-parts";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initialAuthState);
  const usernameError = firstError(state, "username");
  const passwordError = firstError(state, "password");

  return (
    <form action={action} noValidate className="space-y-3.5">
      <FormMessage state={state} />
      <Field id="login-username" label="Username or email address" error={usernameError}>
        <TextInput
          id="login-username"
          name="username"
          autoComplete="username"
          required
          defaultValue={state.values?.username}
          invalid={!!usernameError}
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
