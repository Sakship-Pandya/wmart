"use client";

import { useEffect, useRef, useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

type Mode = "login" | "register";

const copy = {
  login: {
    icon: LogIn,
    title: "Welcome back",
    intro: "Log in to track your orders, save addresses and check out faster.",
    switchPrompt: "Haven't registered yet?",
    switchAction: "Register",
    switchSuffix: "– it only takes a minute.",
  },
  register: {
    icon: UserPlus,
    title: "Create your account",
    intro:
      "Registering lets you see your order status and history. We only ask for what's needed to make checkout faster and easier.",
    switchPrompt: "Already have an account?",
    switchAction: "Log in",
    switchSuffix: "",
  },
} as const;

/**
 * One centred card that switches between the Login and Register forms.
 * The sentence under the form's button switches it; the new form slides in
 * (with reduced motion it just appears).
 */
export function AuthCard() {
  const [mode, setMode] = useState<Mode>("login");
  // How many times the customer has switched. 0 = first page load (no animation, no focus move).
  // Also used as a key so the glow pulse replays once on every switch.
  const [switchCount, setSwitchCount] = useState(0);
  const hasSwitched = switchCount > 0;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const c = copy[mode];
  const Icon = c.icon;

  // After switching, move keyboard/screen-reader focus to the new form's heading
  // without scrolling the page (so the navbar stays in view).
  useEffect(() => {
    if (hasSwitched) headingRef.current?.focus({ preventScroll: true });
  }, [mode, hasSwitched]);

  function switchMode() {
    setSwitchCount((n) => n + 1);
    setMode((m) => (m === "login" ? "register" : "login"));
  }

  return (
    // No visible border or shadow; overflow-hidden still keeps the slide animation inside this area.
    <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl">
      {/*
        Faint orange haze centred behind the form (same for Login and Register).
        The gradient fades to fully transparent before the card's edges, so it has no visible boundary.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--brand) 12%, transparent), transparent)",
        }}
      />
      {/* One soft pulse of the glow each time the customer switches (skipped with reduced motion). */}
      {hasSwitched && (
        <div
          key={switchCount}
          aria-hidden
          className="pointer-events-none absolute inset-0 animate-glow-pulse opacity-0 motion-reduce:hidden"
          style={{
            background:
              "radial-gradient(closest-side, color-mix(in oklab, var(--brand) 14%, transparent), transparent)",
          }}
        />
      )}

      <div
        key={mode}
        id="auth-forms"
        className={cn(
          "relative px-6 pt-5 pb-4 sm:px-8",
          hasSwitched && "animate-in fade-in duration-500 ease-out motion-reduce:animate-none",
          hasSwitched && (mode === "register" ? "slide-in-from-right-12" : "slide-in-from-left-12"),
        )}
      >
        <div className="mb-4 flex flex-col items-center text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-brand/10 text-brand">
            <Icon className="size-[18px]" />
          </span>
          <h2 ref={headingRef} tabIndex={-1} className="mt-2 text-2xl font-bold outline-none">
            {c.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{c.intro}</p>
        </div>

        {mode === "login" ? <LoginForm /> : <RegisterForm />}

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {c.switchPrompt}{" "}
          <button
            type="button"
            onClick={switchMode}
            aria-controls="auth-forms"
            className="font-semibold text-brand underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
          >
            {c.switchAction}
          </button>
          {c.switchSuffix && <> {c.switchSuffix}</>}
        </p>
      </div>
    </div>
  );
}
