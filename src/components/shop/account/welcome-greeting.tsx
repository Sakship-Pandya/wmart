import { Hand } from "lucide-react";

// Account dashboard welcome: the customer's initial in a circle with a soft halo, and a small
// hand that waves twice when the page opens. Animations live in globals.css; motion-safe: keeps
// everything still for visitors who ask their device to reduce motion.
export function WelcomeGreeting({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl bg-gradient-to-b from-brand/10 to-transparent px-6 py-12 text-center">
      <div className="relative" aria-hidden>
        <span className="absolute inset-0 rounded-full bg-brand/30 motion-safe:animate-halo" />
        <span className="relative flex size-20 items-center justify-center rounded-full bg-brand text-3xl font-bold text-brand-foreground shadow-md sm:size-24 sm:text-4xl">
          {initial}
        </span>
        <span className="absolute -right-2 -bottom-1 flex size-9 items-center justify-center rounded-full border bg-background shadow-sm">
          <Hand className="size-5 origin-[70%_90%] text-brand motion-safe:animate-wave" />
        </span>
      </div>
      <h2 className="mt-7 text-2xl font-bold text-heading motion-safe:animate-rise-in sm:text-3xl">
        Welcome back, <span className="text-brand">{name}</span>!
      </h2>
      <p className="mt-2 max-w-md text-muted-foreground motion-safe:animate-rise-in" style={{ animationDelay: "150ms" }}>
        Good to see you again.
      </p>
    </div>
  );
}
