import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// "Nothing here yet" box used by the account sections (orders, downloads, coupons...).
export function AccountEmptyState({
  message,
  actionLabel = "Browse products",
  actionHref = "/",
}: {
  message: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-2xl border border-dashed p-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground">{message}</p>
      <Link href={actionHref} className={cn(buttonVariants(), "rounded-full px-5")}>
        {actionLabel}
      </Link>
    </div>
  );
}
