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

function rankShell(rank: number) {
  if (rank === 1) {
    return "gap-4 rounded-2xl border-bid/50 bg-bid/[0.12] px-5 py-5 sm:gap-5 sm:px-6 sm:py-6";
  }
  if (rank === 2) {
    return "gap-3.5 rounded-2xl border-cyan/40 bg-cyan/[0.10] px-5 py-4 sm:gap-4 sm:px-5 sm:py-5";
  }
  if (rank === 3) {
    return "gap-3.5 rounded-2xl border-bronze/45 bg-bronze/[0.10] px-5 py-4 sm:gap-4 sm:px-5";
  }
  return "gap-3 rounded-xl border-line bg-panel px-4 py-2.5 sm:px-4 sm:py-3";
}

function rankBadge(rank: number) {
  if (rank === 1) return "h-10 min-w-10 px-2.5 text-sm bg-bid/25 text-bid";
  if (rank === 2) return "h-9 min-w-9 px-2 text-sm bg-cyan/20 text-cyan";
  if (rank === 3) return "h-9 min-w-9 px-2 text-sm bg-bronze/20 text-bronze";
  return "h-7 min-w-7 px-1.5 text-[11px] text-muted-foreground";
}

function faviconSize(rank: number) {
  if (rank === 1) return "h-12 w-12";
  if (rank <= 3) return "h-11 w-11";
  return "h-8 w-8";
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
      {listings.map((listing) => {
        const top = listing.rank <= 3;
        const icon = faviconSize(listing.rank);
        return (
          <li key={listing.id}>
            <article className={cn("flex items-center border", rankShell(listing.rank))}>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center justify-center rounded-lg font-semibold tabular-nums",
                  rankBadge(listing.rank),
                )}
              >
                #{listing.rank}
              </span>
              {listing.faviconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.faviconUrl}
                  alt=""
                  width={listing.rank === 1 ? 48 : listing.rank <= 3 ? 44 : 32}
                  height={listing.rank === 1 ? 48 : listing.rank <= 3 ? 44 : 32}
                  className={cn("shrink-0 rounded-lg", icon)}
                />
              ) : (
                <div className={cn("shrink-0 rounded-lg bg-muted", icon)} />
              )}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate font-semibold tracking-tight text-foreground",
                    top ? "text-base sm:text-lg" : "text-sm",
                  )}
                >
                  {listing.name}
                </p>
                {listing.description ? (
                  <p
                    className={cn(
                      "mt-0.5 truncate text-muted-foreground",
                      top ? "text-[13px]" : "text-[12px]",
                    )}
                  >
                    {listing.description}
                  </p>
                ) : null}
                <p className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                  <span className="text-cyan">{categoryLabel(listing.category)}</span>
                  <span className="text-mute/50">·</span>
                  <span className="text-mute">{listedAt(listing.updatedAt)}</span>
                  <span className="text-mute/50">·</span>
                  <span className="text-heat">{listing.clickCount.toLocaleString()} clicks</span>
                  <span className="text-mute/50">·</span>
                  <Link href={`/go/${listing.id}`} className="text-bid underline-offset-2 hover:underline">
                    see details
                  </Link>
                </p>
              </div>
              <Link
                href={`/?claim=${listing.id}&amount=${listing.claimPriceUsd}`}
                className={cn(
                  "shrink-0 text-right font-semibold tabular-nums hover:text-bid",
                  listing.rank === 1 ? "text-2xl text-bid" : top ? "text-xl text-foreground" : "text-lg text-foreground",
                )}
                title={`Outbid ${displayHost(listing.url)}`}
              >
                {formatUsd(listing.bidUsd)}
              </Link>
            </article>
          </li>
        );
      })}
    </ol>
  );
}
