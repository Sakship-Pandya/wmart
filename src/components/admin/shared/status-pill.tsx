import { cn } from "@/lib/utils";
import { toneClass } from "@/lib/orders";

export function StatusPill({
  tone,
  label,
  className,
}: {
  tone: keyof typeof toneClass;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
        toneClass[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
