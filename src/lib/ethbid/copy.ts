import { DEFAULT_CHAIN_ID, networkOrDefault, type BidAsset } from "./chains";
import { ethbidContracts } from "./config";

const TESTNET_CHAIN_IDS = new Set([421614, 46630]);

export type SettlementCopy = {
  chainId: number;
  label: string;
  asset: BidAsset;
  explorer: string;
  isTestnet: boolean;
  testnetBadge: string | null;
  faucetStable?: string;
  faucetEth?: string;
};

function testnetBadge(chainId: number): string | null {
  if (chainId === 421614) return "Arbitrum Sepolia testnet";
  if (chainId === 46630) return "Robinhood Chain testnet";
  return null;
}

export function settlementCopy(): SettlementCopy {
  const contracts = ethbidContracts();
  const parsed = Number(process.env.NEXT_PUBLIC_ETHBID_CHAIN_ID ?? "");
  const chainId =
    Number.isInteger(parsed) && parsed > 0 ? parsed : (contracts?.chainId ?? DEFAULT_CHAIN_ID);
  const network = networkOrDefault(chainId);
  return {
    chainId: network.id,
    label: network.label,
    asset: network.bidAsset,
    explorer: network.explorer.replace(/\/$/, ""),
    isTestnet: TESTNET_CHAIN_IDS.has(network.id),
    testnetBadge: testnetBadge(network.id),
    faucetStable: network.faucetStable,
    faucetEth: network.faucetEth,
  };
}

export function usesGraphIndex(copy: SettlementCopy = settlementCopy()): boolean {
  return copy.chainId === 1;
}

export function siteDescription(copy: SettlementCopy = settlementCopy()): string {
  const tail = usesGraphIndex(copy)
    ? "Rank anyone can reconstruct from the contracts and The Graph."
    : "Rank anyone can reconstruct from the contracts.";
  return `Onchain discovery market for crypto products. Verify ownership. Bid ${copy.asset} on ${copy.label}. ${tail}`;
}

export function shareDescription(copy: SettlementCopy = settlementCopy()): string {
  return usesGraphIndex(copy)
    ? "Verify. Bid. Rank. Reconstruct it from contracts and The Graph."
    : "Verify. Bid. Rank. Reconstruct it from the contracts.";
}

export function reconstructFrom(copy: SettlementCopy = settlementCopy()): string {
  return usesGraphIndex(copy) ? "the contracts and The Graph" : "the contracts and event logs";
}

export function listingRankRule(copy: SettlementCopy = settlementCopy()): string {
  return usesGraphIndex(copy)
    ? "The listing is the product URL. Rank is the subgraph total, not clicks."
    : "The listing is the product URL. Rank is the event log total, not clicks.";
}

export function thirdPartyRankCopy(copy: SettlementCopy = settlementCopy()): string {
  return usesGraphIndex(copy)
    ? "A third party can query the subgraph and get the same order."
    : "A third party can read the same order from the contract events.";
}

export function graphQueryUrl(): string | null {
  const url = process.env.GRAPH_SUBGRAPH_URL?.trim();
  return url || null;
}
