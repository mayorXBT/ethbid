import type { CategorySlug } from "./categories";

export type BidKind = "new" | "raise";
export type BidStatus = "pending" | "paid" | "failed" | "expired";
export type ActivityKind = "claimed" | "raised";

export interface Listing {
  id: string;
  canonicalKey: string;
  url: string;
  handle: string | null;
  name: string;
  description: string;
  faviconUrl: string | null;
  ogImageUrl: string | null;
  category: CategorySlug;
  bidUsd: number;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RankedListing extends Listing {
  rank: number;
  claimPriceUsd: number;
  share: number;
}

export interface Bid {
  id: string;
  listingId: string | null;
  canonicalKey: string;
  url: string;
  category: CategorySlug;
  targetBidUsd: number;
  amountDueUsd: number;
  kind: BidKind;
  status: BidStatus;
  crossmintOrderId: string | null;
  depositEvm: string | null;
  depositSol: string | null;
  createdAt: string;
  paidAt: string | null;
}

export interface ActivityItem {
  id: string;
  listingId: string;
  name: string;
  rank: number;
  bidUsd: number;
  kind: ActivityKind;
  createdAt: string;
}

export interface SiteStats {
  online: number;
  visitors: number;
  listings: number;
  volumeUsd: number;
  clicks: number;
}

export interface BoardSnapshot {
  listings: RankedListing[];
  activity: ActivityItem[];
  stats: SiteStats;
  topBidUsd: number;
}
