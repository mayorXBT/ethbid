import type { CategorySlug } from "./categories";

export type ActivityKind = "claimed" | "raised";
export type VerificationKind = "None" | "Ens" | "Domain";

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
  verification?: VerificationKind;
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
