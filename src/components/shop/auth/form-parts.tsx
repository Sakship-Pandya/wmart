"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { AuthFormState } from "@/lib/validation/auth";

/** Label + input + error message, with the error linked for screen readers. */
export function Field({
  id,
  label,
  error,
  optional = false,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  /** Shows "(optional)" instead of the red required star. */
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={id} className="text-heading">
        {label}{" "}
        {optional ? (
          <span className="font-normal text-muted-foreground">(optional)</span>
        ) : (
          <span className="text-brand" aria-hidden>*</span>
        )}
      </Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextInput({ invalid, className, ...props }: ComponentProps<typeof Input> & { invalid?: boolean }) {
  return (
    <Input
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `${props.id}-error` : undefined}
      className={cn(
        "h-10 rounded-full px-4",
        // No blue: orange focus outline instead of the theme blue.
        "focus-visible:border-brand focus-visible:ring-brand/20",
        // When the browser autofills a saved login it paints the field light blue. Delaying that
        // background change "forever" keeps autofilled fields transparent, like the empty ones.
        "autofill:[transition:background-color_600000s_0s,color_600000s_0s] autofill:[-webkit-text-fill-color:var(--foreground)]",
        className,
      )}
      {...props}
    />
  );
}

/** Password box with a show/hide button, like the old site. */
export function PasswordInput(props: ComponentProps<typeof Input> & { invalid?: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <TextInput {...props} type={visible ? "text" : "password"} className="pr-11" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

/** Message box shown after the form is submitted. */
export function FormMessage({ state }: { state: AuthFormState }) {
  if (!state.message) return null;
  const ok = state.status === "success";
  return (
    <p
      role={ok ? "status" : "alert"}
      className={cn(
        "rounded-xl px-4 py-3 text-sm",
        ok ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
      )}
    >
      {state.message}
    </p>
  );
}

export function firstError(state: AuthFormState, field: string) {
  return state.fieldErrors?.[field]?.[0];
}
