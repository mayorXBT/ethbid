import { createPublicClient, http, type Address, type Hex } from "viem";
import { addressAvatarUrl } from "../avatar";
import { rankListings, topBidUsd } from "../ranking";
import { siteFaviconUrl } from "../site-preview";
import type { ActivityItem, BoardSnapshot, Listing } from "../types";
import { categoryFromUrl } from "../urls";
import { projectRegistryAbi, rankingRoundAbi } from "./abi";
import { networkOrDefault } from "./chains";
import type { EthbidContracts } from "./config";
import { usdcToUsd, unixToIso } from "../graph/board";

type ProjectMeta = {
  id: Hex;
  owner: Address;
  metadataURI: string;
};

type LiveBid = {
  projectId: Hex;
  owner: Address;
  total: bigint;
  firstAt: bigint;
  lastTx: Hex;
};

function settlementClient(contracts: EthbidContracts) {
  const network = networkOrDefault(contracts.chainId);
  return createPublicClient({
    chain: network.chain,
    transport: http(network.rpc),
  });
}

function listingFromLog(bid: LiveBid, meta: ProjectMeta | undefined): Listing {
  const uri = meta?.metadataURI?.trim() ?? "";
  let url = uri;
  let name = `${bid.projectId.slice(0, 10)}…`;
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
  const createdAt = unixToIso(bid.firstAt.toString());
  const owner = bid.owner.toLowerCase();
  return {
    id: bid.projectId,
    canonicalKey: bid.projectId,
    url,
    handle: null,
    name,
    description: "",
    faviconUrl: siteFaviconUrl(host) ?? addressAvatarUrl(owner),
    ogImageUrl: null,
    category: categoryFromUrl(url) ?? "infra",
    verification: "None",
    owner,
    bidUsd: usdcToUsd(bid.total.toString()),
    clickCount: 0,
    createdAt,
    updatedAt: createdAt,
  };
}

export async function getLogsBoard(contracts: EthbidContracts): Promise<BoardSnapshot> {
  const client = settlementClient(contracts);
  const fromBlock = contracts.startBlock > 0n ? contracts.startBlock : 1n;
  const roundId = await client.readContract({
    address: contracts.ranking,
    abi: rankingRoundAbi,
    functionName: "currentRoundId",
  });
  if (roundId === 0n) {
    return {
      listings: [],
      activity: [],
      stats: { online: 0, visitors: 0, listings: 0, volumeUsd: 0, clicks: 0 },
      topBidUsd: 0,
    };
  }

  const [placed, increased, withdrawn, registered, updated] = await Promise.all([
    client.getContractEvents({
      address: contracts.ranking,
      abi: rankingRoundAbi,
      eventName: "BidPlaced",
      fromBlock,
      args: { roundId },
    }),
    client.getContractEvents({
      address: contracts.ranking,
      abi: rankingRoundAbi,
      eventName: "BidIncreased",
      fromBlock,
      args: { roundId },
    }),
    client.getContractEvents({
      address: contracts.ranking,
      abi: rankingRoundAbi,
      eventName: "BidWithdrawn",
      fromBlock,
      args: { roundId },
    }),
    client.getContractEvents({
      address: contracts.registry,
      abi: projectRegistryAbi,
      eventName: "ProjectRegistered",
      fromBlock,
    }),
    client.getContractEvents({
      address: contracts.registry,
      abi: projectRegistryAbi,
      eventName: "ProjectUpdated",
      fromBlock,
    }),
  ]);

  const projects = new Map<string, ProjectMeta>();
  for (const log of registered) {
    const id = log.args.id;
    const owner = log.args.owner;
    if (!id || !owner) continue;
    projects.set(id.toLowerCase(), { id, owner, metadataURI: log.args.metadataURI ?? "" });
  }
  for (const log of updated) {
    const id = log.args.id;
    if (!id) continue;
    const prev = projects.get(id.toLowerCase());
    if (prev) prev.metadataURI = log.args.metadataURI ?? prev.metadataURI;
  }

  const bids = new Map<string, LiveBid>();
  const activitySource: { kind: "claimed" | "raised"; bid: LiveBid; amount: bigint; block: bigint; tx: Hex }[] = [];

  for (const log of placed) {
    const projectId = log.args.projectId;
    const owner = log.args.owner;
    const total = log.args.total;
    if (!projectId || !owner || total == null) continue;
    const row: LiveBid = {
      projectId,
      owner,
      total,
      firstAt: log.blockNumber,
      lastTx: log.transactionHash,
    };
    bids.set(projectId.toLowerCase(), row);
    activitySource.push({ kind: "claimed", bid: row, amount: log.args.amount ?? total, block: log.blockNumber, tx: log.transactionHash });
  }
  for (const log of increased) {
    const projectId = log.args.projectId;
    const owner = log.args.owner;
    const total = log.args.total;
    if (!projectId || !owner || total == null) continue;
    const prev = bids.get(projectId.toLowerCase());
    const row: LiveBid = {
      projectId,
      owner,
      total,
      firstAt: prev?.firstAt ?? log.blockNumber,
      lastTx: log.transactionHash,
    };
    bids.set(projectId.toLowerCase(), row);
    activitySource.push({ kind: "raised", bid: row, amount: log.args.amount ?? 0n, block: log.blockNumber, tx: log.transactionHash });
  }
  for (const log of withdrawn) {
    const projectId = log.args.projectId;
    if (!projectId) continue;
    bids.delete(projectId.toLowerCase());
  }

  const times = new Map<bigint, bigint>();
  async function blockTime(blockNumber: bigint): Promise<bigint> {
    const cached = times.get(blockNumber);
    if (cached != null) return cached;
    const block = await client.getBlock({ blockNumber });
    times.set(blockNumber, block.timestamp);
    return block.timestamp;
  }
  const timed: LiveBid[] = [];
  for (const bid of bids.values()) {
    timed.push({ ...bid, firstAt: await blockTime(bid.firstAt) });
  }

  const listings = timed.map((bid) => listingFromLog(bid, projects.get(bid.projectId.toLowerCase())));
  const ranked = rankListings(listings);
  const rankById = new Map(ranked.map((row) => [row.id, row.rank]));
  const activity: ActivityItem[] = [];
  const recent = activitySource.sort((a, b) => Number(b.block - a.block)).slice(0, 20);
  for (const event of recent) {
    const createdAt = unixToIso((await blockTime(event.block)).toString());
    activity.push({
      id: event.tx,
      listingId: event.bid.projectId,
      name: ranked.find((row) => row.id === event.bid.projectId)?.name ?? `${event.bid.projectId.slice(0, 10)}…`,
      rank: rankById.get(event.bid.projectId) ?? 0,
      bidUsd: usdcToUsd(event.amount.toString()),
      kind: event.kind,
      createdAt,
    });
  }
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

export async function getLogsBids(contracts: EthbidContracts): Promise<{ projectId: string; total: string }[]> {
  const board = await getLogsBoard(contracts);
  return board.listings.map((row) => ({ projectId: row.id, total: String(Math.round(row.bidUsd * 1_000_000)) }));
}
