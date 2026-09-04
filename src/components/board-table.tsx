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
    return "gap-3 rounded-2xl border-bid/50 bg-bid/[0.12] px-3 py-3.5 sm:gap-5 sm:px-6 sm:py-6";
  }
  if (rank === 2) {
    return "gap-3 rounded-2xl border-cyan/40 bg-cyan/[0.10] px-3 py-3 sm:gap-4 sm:px-5 sm:py-5";
  }
  if (rank === 3) {
    return "gap-3 rounded-2xl border-bronze/45 bg-bronze/[0.10] px-3 py-3 sm:gap-4 sm:px-5";
  }
  return "gap-2.5 rounded-xl border-line bg-panel px-3 py-2.5 sm:px-4 sm:py-3";
}

function rankBadge(rank: number) {
  if (rank === 1) return "h-8 min-w-8 px-1.5 text-xs bg-bid/25 text-bid sm:h-10 sm:min-w-10 sm:px-2.5 sm:text-sm";
  if (rank === 2) return "h-8 min-w-8 px-1.5 text-xs bg-cyan/20 text-cyan sm:h-9 sm:min-w-9 sm:px-2 sm:text-sm";
  if (rank === 3) return "h-8 min-w-8 px-1.5 text-xs bg-bronze/20 text-bronze sm:h-9 sm:min-w-9 sm:px-2 sm:text-sm";
  return "h-7 min-w-7 px-1.5 text-[11px] text-muted-foreground";
}

function faviconSize(rank: number) {
  if (rank === 1) return "h-8 w-8 sm:h-12 sm:w-12";
  if (rank <= 3) return "h-8 w-8 sm:h-11 sm:w-11";
  return "h-7 w-7 sm:h-8 sm:w-8";
}

export function BoardTable({ listings }: { listings: RankedListing[] }) {
  if (listings.length === 0) {
    return (
      <div className="border border-dashed border-line px-6 py-16 text-center text-sm text-muted-foreground">
        Board is empty. First canonical USDC bid this round takes #1.
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
            <article className={cn("flex items-start border", rankShell(listing.rank))}>
              <span
                className={cn(
                  "mt-0.5 inline-flex shrink-0 items-center justify-center rounded-lg font-semibold tabular-nums",
                  rankBadge(listing.rank),
                )}
              >
                #{listing.rank}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2.5">
                  {listing.faviconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={listing.faviconUrl}
                      alt=""
                      width={listing.rank === 1 ? 48 : listing.rank <= 3 ? 44 : 32}
                      height={listing.rank === 1 ? 48 : listing.rank <= 3 ? 44 : 32}
                      className={cn("mt-0.5 shrink-0 rounded-lg", icon)}
                    />
                  ) : (
                    <div className={cn("mt-0.5 shrink-0 rounded-lg bg-muted", icon)} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p
                        className={cn(
                          "min-w-0 font-semibold tracking-tight text-foreground",
                          top ? "text-sm sm:text-lg" : "text-sm",
                        )}
                      >
                        {listing.name}
                      </p>
                      <Link
                        href={`/?claim=${listing.id}&amount=${listing.claimPriceUsd}`}
                        className={cn(
                          "shrink-0 text-right font-semibold tabular-nums hover:text-bid",
                          listing.rank === 1
                            ? "text-xl text-bid sm:text-2xl"
                            : top
                              ? "text-lg text-foreground sm:text-xl"
                              : "text-base text-foreground sm:text-lg",
                        )}
                        title={`Outbid ${displayHost(listing.url)}`}
                      >
                        {formatUsd(listing.bidUsd)}
                      </Link>
                    </div>
                    {listing.description ? (
                      <p
                        className={cn(
                          "mt-0.5 whitespace-normal break-words text-muted-foreground",
                          top ? "text-[13px] leading-5" : "text-[12px] leading-[18px]",
                        )}
                      >
                        {listing.description}
                      </p>
                    ) : null}
                    <p className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                      <span className="text-cyan">
                        {listing.verification === "Ens"
                          ? "ENS verified"
                          : listing.verification === "Domain"
                            ? "Domain verified"
                            : categoryLabel(listing.category)}
                      </span>
                      <span className="text-mute/50">·</span>
                      <span className="text-mute">{listedAt(listing.updatedAt)}</span>
                      <span className="text-mute/50">·</span>
                      <span className="text-heat">{listing.clickCount.toLocaleString()} clicks</span>
                      <span className="text-mute/50">·</span>
                      <Link
                        href={listing.id.startsWith("0x") ? listing.url : `/go/${listing.id}`}
                        className="text-bid underline-offset-2 hover:underline"
                      >
                        see details
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </li>
        );
      })}
    </ol>
  );
}
