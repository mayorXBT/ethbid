import type { ActivityItem, BoardSnapshot, Listing } from "../types";
import { rankListings, topBidUsd } from "../ranking";
import { categoryFromUrl } from "../urls";
import { graphQuery } from "./client";
import { ACTIVE_ROUND, CURRENT_LEADERBOARD, RECENT_BID_ACTIVITY } from "./queries";

type GraphProject = {
  id: string;
  owner: string;
  verification: string;
  identityRef: string;
  metadataURI: string;
};

type GraphBid = {
  id: string;
  canonicalUsdc: string;
  createdAt: string;
  txHash: string;
  project: GraphProject;
};

type GraphEvent = {
  id: string;
  kind: string;
  canonicalUsdc: string;
  timestamp: string;
  txHash: string;
  owner: string;
  project: { id: string };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function usdcToUsd(raw: string): number {
  try {
    return Number(BigInt(raw)) / 1_000_000;
  } catch {
    return 0;
  }
}

export function unixToIso(raw: string): string {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return new Date(0).toISOString();
  return new Date(n * 1000).toISOString();
}

function projectFromUnknown(value: unknown): GraphProject | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  if (!id) return null;
  return {
    id,
    owner: asString(value.owner),
    verification: asString(value.verification) || "None",
    identityRef: asString(value.identityRef),
    metadataURI: asString(value.metadataURI),
  };
}

function asOwner(value: string): string | null {
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) return null;
  return value.toLowerCase();
}

export function addressAvatarUrl(owner: string | null): string | null {
  if (!owner) return null;
  return `https://api.dicebear.com/10.x/avataaars/svg?seed=${encodeURIComponent(owner)}`;
}

export function listingFromGraphBid(bid: GraphBid): Listing {
  const uri = bid.project.metadataURI.trim();
  let url = uri;
  let name = `${bid.project.id.slice(0, 10)}…`;
  let host = "";
  try {
    const parsed = new URL(uri);
    url = parsed.toString();
    host = parsed.hostname.replace(/^www\./i, "");
    name = host || name;
  } catch {
    if (uri) name = uri;
    url = "https://ethbid.longbid.lol";
  }
  const createdAt = unixToIso(bid.createdAt);
  const verification = bid.project.verification;
  const description =
    verification === "Ens" ? "ENS verified" : verification === "Domain" ? "Domain verified" : "";
  const owner = asOwner(bid.project.owner);
  return {
    id: bid.project.id,
    canonicalKey: bid.project.id,
    url,
    handle: null,
    name,
    description,
    faviconUrl: addressAvatarUrl(owner),
    ogImageUrl: null,
    category: categoryFromUrl(url) ?? "infra",
    verification: verification === "Ens" || verification === "Domain" ? verification : "None",
    owner,
    bidUsd: usdcToUsd(bid.canonicalUsdc),
    clickCount: 0,
    createdAt,
    updatedAt: createdAt,
  };
}

export function parseGraphBids(value: unknown): GraphBid[] {
  if (!Array.isArray(value)) return [];
  const out: GraphBid[] = [];
  for (const row of value) {
    if (!isRecord(row)) continue;
    const project = projectFromUnknown(row.project);
    if (!project) continue;
    out.push({
      id: asString(row.id),
      canonicalUsdc: asString(row.canonicalUsdc),
      createdAt: asString(row.createdAt),
      txHash: asString(row.txHash),
      project,
    });
  }
  return out;
}

function parseGraphEvents(value: unknown): GraphEvent[] {
  if (!Array.isArray(value)) return [];
  const out: GraphEvent[] = [];
  for (const row of value) {
    if (!isRecord(row)) continue;
    const project = isRecord(row.project) ? asString(row.project.id) : "";
    if (!project) continue;
    out.push({
      id: asString(row.id),
      kind: asString(row.kind),
      canonicalUsdc: asString(row.canonicalUsdc),
      timestamp: asString(row.timestamp),
      txHash: asString(row.txHash),
      owner: asString(row.owner),
      project: { id: project },
    });
  }
  return out;
}

function emptyBoard(): BoardSnapshot {
  return {
    listings: [],
    activity: [],
    stats: { online: 0, visitors: 0, listings: 0, volumeUsd: 0, clicks: 0 },
    topBidUsd: 0,
  };
}

export async function getGraphBoard(): Promise<BoardSnapshot> {
  const rounds = await graphQuery<{ rounds: { id: string }[] }>(ACTIVE_ROUND);
  const roundId = rounds.rounds[0]?.id;
  if (!roundId) return emptyBoard();
  const [board, recent] = await Promise.all([
    graphQuery<{ bids: unknown }>(CURRENT_LEADERBOARD, { roundId }),
    graphQuery<{ bidEvents: unknown }>(RECENT_BID_ACTIVITY),
  ]);
  const listings = parseGraphBids(board.bids).map(listingFromGraphBid);
  const ranked = rankListings(listings);
  const rankById = new Map(ranked.map((row) => [row.id, row.rank]));
  const activity: ActivityItem[] = parseGraphEvents(recent.bidEvents)
    .filter((event) => event.kind !== "withdrawn")
    .slice(0, 20)
    .map((event) => ({
      id: event.id,
      listingId: event.project.id,
      name: ranked.find((row) => row.id === event.project.id)?.name ?? `${event.project.id.slice(0, 10)}…`,
      rank: rankById.get(event.project.id) ?? 0,
      bidUsd: usdcToUsd(event.canonicalUsdc),
      kind: event.kind === "increased" ? "raised" : "claimed",
      createdAt: unixToIso(event.timestamp),
    }));
  const volumeUsd = ranked.reduce((sum, row) => sum + row.bidUsd, 0);
  return {
    listings: ranked,
    activity,
    stats: {
      online: 0,
      visitors: 0,
      listings: ranked.length,
      volumeUsd,
      clicks: 0,
    },
    topBidUsd: topBidUsd(listings),
  };
}
