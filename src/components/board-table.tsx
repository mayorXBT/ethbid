import { categoryLabel } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { formatUsd } from "@/lib/money";
import type { RankedListing } from "@/lib/types";
import { displayHost } from "@/lib/urls";
import Link from "next/link";

function listedAt(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).replace(",", "");
}

export function BoardTable({ listings }: { listings: RankedListing[] }) {
  if (listings.length === 0) {
    return (
      <div className="border border-dashed border-line px-6 py-16 text-center text-sm text-muted-foreground">
        Board is empty. First $1 USDC listing takes #1.
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {listings.map((listing) => (
        <li key={listing.id}>
          <article
            className={cn(
              "flex items-center gap-2.5 border border-line bg-panel px-3 py-2.5 sm:gap-3 sm:px-4",
              listing.rank === 1 && "bg-bid/[0.06]",
            )}
          >
            <span
              className={cn(
                "inline-flex h-8 shrink-0 items-center justify-center rounded-md px-2 text-xs font-semibold tabular-nums",
                listing.rank === 1
                  ? "bg-bid/15 text-bid"
                  : listing.rank <= 3
                    ? "bg-cyan/10 text-cyan"
                    : "bg-muted text-muted-foreground",
              )}
            >
              #{listing.rank}
            </span>
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-line bg-void/40 px-3 py-2.5">
              {listing.faviconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.faviconUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 shrink-0 rounded-md bg-void"
                />
              ) : (
                <div className="h-8 w-8 shrink-0 rounded-md bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {listing.name}
                  {listing.description ? (
                    <span className="font-normal text-muted-foreground"> — {listing.description}</span>
                  ) : null}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {categoryLabel(listing.category)}
                  {" · "}
                  {listedAt(listing.updatedAt)}
                  {" · "}
                  {listing.clickCount.toLocaleString()} clicks
                  {" · "}
                  <Link href={`/go/${listing.id}`} className="underline-offset-2 hover:text-bid hover:underline">
                    see details
                  </Link>
                </p>
              </div>
            </div>
            <Link
              href={`/?claim=${listing.id}&amount=${listing.claimPriceUsd}`}
              className="shrink-0 text-right text-lg font-semibold tabular-nums text-foreground hover:text-bid"
              title={`Outbid ${displayHost(listing.url)}`}
            >
              {formatUsd(listing.bidUsd)}
            </Link>
          </article>
        </li>
      ))}
    </ol>
  );
}
