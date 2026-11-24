import { formatPrice } from "@/lib/format";

type Day = { day: string; revenue: number; orders: number };

const dayLabel = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
const weekday = new Intl.DateTimeFormat("en-IN", { weekday: "short", timeZone: "UTC" });

/**
 * Daily revenue bars for the last 14 days (single series, so no legend: the card title names it).
 * Pure HTML/CSS. Each bar has a hover/focus tooltip, and a screen-reader table carries the same data.
 */
export function RevenueChart({ daily }: { daily: Day[] }) {
  const max = Math.max(...daily.map((d) => d.revenue), 1);
  const best = daily.reduce((a, b) => (b.revenue > a.revenue ? b : a), daily[0]);

  return (
    <div>
      <div className="relative h-44" aria-hidden="true">
        {/* Recessive grid: top line labelled with the peak, plus the baseline */}
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-border" />
        <span className="absolute -top-2.5 right-0 bg-card pl-1 text-[10px] text-muted-foreground">{formatPrice(max)}</span>
        <div className="absolute inset-x-0 bottom-0 border-t border-border" />

        <div className="absolute inset-0 flex items-end gap-0.5">
          {daily.map((d) => {
            const height = d.revenue > 0 ? Math.max(3, (d.revenue / max) * 100) : 0;
            const date = new Date(`${d.day}T00:00:00Z`);
            return (
              // Full-height hit target, wider than the visible bar.
              <div key={d.day} tabIndex={0} className="group relative flex h-full flex-1 items-end justify-center outline-none">
                <div
                  className="w-full max-w-7 rounded-t-[4px] bg-brand/80 transition-colors group-hover:bg-brand group-focus-visible:bg-brand"
                  style={{ height: `${height}%` }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover:block group-focus-visible:block">
                  <p className="font-medium">
                    {weekday.format(date)}, {dayLabel.format(date)}
                  </p>
                  <p>{formatPrice(d.revenue)}</p>
                  <p className="text-muted-foreground">
                    {d.orders} {d.orders === 1 ? "order" : "orders"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sparse x-axis labels: first, middle, last */}
      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground" aria-hidden="true">
        <span>{dayLabel.format(new Date(`${daily[0].day}T00:00:00Z`))}</span>
        <span>{dayLabel.format(new Date(`${daily[Math.floor(daily.length / 2)].day}T00:00:00Z`))}</span>
        <span>Today</span>
      </div>

      {best.revenue > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Best day: {dayLabel.format(new Date(`${best.day}T00:00:00Z`))} · {formatPrice(best.revenue)}
        </p>
      )}

      <table className="sr-only">
        <caption>Revenue per day, last 14 days</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Revenue</th>
            <th scope="col">Orders</th>
          </tr>
        </thead>
        <tbody>
          {daily.map((d) => (
            <tr key={d.day}>
              <td>{dayLabel.format(new Date(`${d.day}T00:00:00Z`))}</td>
              <td>{formatPrice(d.revenue)}</td>
              <td>{d.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
