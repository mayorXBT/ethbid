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
              "flex items-center gap-3 rounded-2xl border border-line bg-panel px-4 py-3 sm:gap-4 sm:px-5 sm:py-3.5",
              listing.rank === 1 && "border-bid/35 bg-bid/[0.08]",
            )}
          >
            <span
              className={cn(
                "inline-flex h-8 shrink-0 items-center justify-center rounded-lg px-2 text-xs font-semibold tabular-nums",
                listing.rank === 1
                  ? "bg-bid/20 text-bid"
                  : listing.rank <= 3
                    ? "bg-cyan/10 text-cyan"
                    : "text-muted-foreground",
              )}
            >
              #{listing.rank}
            </span>
            {listing.faviconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.faviconUrl}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 rounded-lg"
              />
            ) : (
              <div className="h-10 w-10 shrink-0 rounded-lg bg-muted" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold tracking-tight text-foreground">{listing.name}</p>
              {listing.description ? (
                <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{listing.description}</p>
              ) : null}
              <p className="mt-1 truncate text-[11px] text-muted-foreground">
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
