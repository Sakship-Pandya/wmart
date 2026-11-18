"use client";

import { useState, useTransition } from "react";
import { Lock, Mail, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { loginAdminAction } from "@/server/actions/admin/auth";

export function AdminLoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await loginAdminAction(formData);
        if (result?.error) {
          setError(result.error);
        }
      } catch (err: unknown) {
        // Next.js redirect throws a NEXT_REDIRECT error which is expected
        if (err && typeof err === "object" && "digest" in err) {
          throw err;
        }
        setError("An unexpected error occurred. Please try again.");
      }
    });
  }

  return (
    <Card className="w-full max-w-sm shadow-md">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="size-6" />
        </div>
        <CardTitle className="text-xl font-bold">WMart Admin</CardTitle>
        <CardDescription>
          Sign in to access the product catalogue and store management.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                name="email"
                type="email"
                placeholder="admin@wmartstore.in"
                defaultValue="admin@wmartstore.in"
                className="pl-9 text-sm"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                name="password"
                type="password"
                placeholder="••••••••"
                className="pl-9 text-sm"
                required
              />
            </div>
          </div>

          <div className="rounded-md bg-muted/60 p-2.5 text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">Tip:</span> Default dev password is{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-foreground font-semibold">
              admin123
            </code>{" "}
            (configured via <code className="font-mono">ADMIN_PASSWORD</code> in <code className="font-mono">.env</code>).
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

