"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormMessage, TextInput, firstError } from "@/components/shop/auth/form-parts";
import { sendContactMessage } from "@/server/actions/forms";
import { initialFormState } from "@/lib/validation/forms";

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactMessage, initialFormState);
  const err = (f: string) => firstError(state, f);
  return (
    <form action={action} noValidate className="space-y-3.5">
      <FormMessage state={state} />
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field id="contact-name" label="Your name" error={err("name")}>
          <TextInput id="contact-name" name="name" autoComplete="name" required defaultValue={state.values?.name} invalid={!!err("name")} />
        </Field>
        <Field id="contact-phone" label="Mobile number" optional error={err("phone")}>
          <TextInput id="contact-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={state.values?.phone} invalid={!!err("phone")} />
        </Field>
      </div>
      <Field id="contact-email" label="Email address" error={err("email")}>
        <TextInput id="contact-email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} invalid={!!err("email")} />
      </Field>
      <Field id="contact-message" label="Message" error={err("message")}>
        <Textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          placeholder="Tell us your laptop model or the part number you need."
          defaultValue={state.values?.message}
          aria-invalid={!!err("message") || undefined}
          aria-describedby={err("message") ? "contact-message-error" : undefined}
          className="rounded-2xl px-4 py-3 focus-visible:border-brand focus-visible:ring-brand/20"
        />
      </Field>
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          Leave this empty
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <Button type="submit" disabled={pending} className="h-10 rounded-full bg-brand px-6 text-base font-semibold text-brand-foreground hover:bg-brand/85">
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
