import { MIN_NEW_BID_USD, TOP_SPOT_PREMIUM_USD, clampBid } from "./money";
import type { Listing, RankedListing } from "./types";

export function rankListings(listings: Listing[]): RankedListing[] {
  const sorted = [...listings].sort((a, b) => {
    if (b.bidUsd !== a.bidUsd) return b.bidUsd - a.bidUsd;
    return a.createdAt.localeCompare(b.createdAt);
  });

  const volume = sorted.reduce((sum, l) => sum + l.bidUsd, 0);

  return sorted.map((listing, index) => {
    const rank = index + 1;
    return {
      ...listing,
      rank,
      claimPriceUsd: claimPriceForRank(sorted, rank),
      share: volume === 0 ? 0 : listing.bidUsd / volume,
    };
  });
}

export function topBidUsd(listings: Listing[]): number {
  return listings.reduce((max, l) => Math.max(max, l.bidUsd), 0);
}

export function claimPriceForRank(sortedDesc: Listing[], rank: number): number {
  if (sortedDesc.length === 0) return MIN_NEW_BID_USD;
  if (rank <= 1) {
    return Math.max(MIN_NEW_BID_USD, sortedDesc[0].bidUsd + TOP_SPOT_PREMIUM_USD);
  }
  const target = sortedDesc[rank - 1];
  if (!target) return MIN_NEW_BID_USD;
  return Math.max(MIN_NEW_BID_USD, target.bidUsd + 1);
}

export function rankForBid(listings: Listing[], bidUsd: number, createdAt?: string): number {
  const probe: Listing = {
    id: "__probe__",
    canonicalKey: "__probe__",
    url: "https://longbid.lol",
    handle: null,
    name: "probe",
    description: "",
    faviconUrl: null,
    ogImageUrl: null,
    category: "defi",
    bidUsd,
    clickCount: 0,
    createdAt: createdAt ?? new Date().toISOString(),
    updatedAt: createdAt ?? new Date().toISOString(),
  };
  return rankListings([...listings, probe]).find((l) => l.id === "__probe__")?.rank ?? listings.length + 1;
}

export function quoteBid(input: {
  listings: Listing[];
  existing?: Listing | null;
  requestedUsd: number;
}): {
  ok: true;
  kind: "new" | "raise";
  targetBidUsd: number;
  amountDueUsd: number;
  projectedRank: number;
} | {
  ok: false;
  error: string;
} {
  const requested = clampBid(input.requestedUsd);

  if (input.existing) {
    if (requested <= input.existing.bidUsd) {
      return {
        ok: false,
        error: `Raise above your current ${input.existing.bidUsd} USDC bid.`,
      };
    }
    const others = input.listings.filter((l) => l.id !== input.existing!.id);
    return {
      ok: true,
      kind: "raise",
      targetBidUsd: requested,
      amountDueUsd: requested - input.existing.bidUsd,
      projectedRank: rankForBid(others, requested, input.existing.createdAt),
    };
  }

  if (requested < MIN_NEW_BID_USD) {
    return {
      ok: false,
      error: `New spots start at ${MIN_NEW_BID_USD} USDC.`,
    };
  }

  return {
    ok: true,
    kind: "new",
    targetBidUsd: requested,
    amountDueUsd: requested,
    projectedRank: rankForBid(input.listings, requested),
  };
}
