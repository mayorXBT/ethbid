import { formatUsd } from "@/lib/money";
import type { ActivityItem } from "@/lib/types";

function timeAgo(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime();
  const min = Math.max(1, Math.round(delta / 60000));
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.round(hr / 24)}d`;
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Latest bids</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No bids this round yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between border border-line bg-panel px-4 py-2.5 text-sm"
            >
              <p className="min-w-0 truncate">
                <span className="text-bid">{item.name}</span>{" "}
                {item.kind === "raised" ? "raised" : "claimed"} #{item.rank}
                <span className="ml-2 text-[11px] text-muted-foreground">{timeAgo(item.createdAt)}</span>
              </p>
              <span className="ml-3 shrink-0 tabular-nums">{formatUsd(item.bidUsd)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
