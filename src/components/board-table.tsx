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
  });
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
              "relative flex items-center gap-3 border border-line bg-panel px-4 py-3 sm:gap-4 sm:px-5",
              listing.rank === 1 && "bg-bid/[0.07]",
            )}
          >
            {listing.rank === 1 ? <span className="absolute inset-y-0 left-0 w-0.5 bg-bid" /> : null}
            <div
              className={cn(
                "w-10 shrink-0 text-xl tabular-nums",
                listing.rank === 1 ? "text-bid" : listing.rank <= 3 ? "text-cyan" : "text-muted-foreground",
              )}
            >
              {listing.rank}
            </div>
            {listing.faviconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.faviconUrl}
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 rounded-sm bg-void"
              />
            ) : (
              <div className="h-9 w-9 shrink-0 rounded-sm bg-muted" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {listing.name}
                {listing.description ? (
                  <span className="font-normal text-muted-foreground"> — {listing.description}</span>
                ) : null}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {displayHost(listing.url)}
              </p>
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
            >
              {formatUsd(listing.bidUsd)}
            </Link>
          </article>
        </li>
      ))}
    </ol>
  );
}
