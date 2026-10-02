import type { Address } from "viem";
import { DEFAULT_CHAIN_ID, networkOrDefault, type BidAsset } from "./chains";

export type EthbidContracts = {
  registry: Address;
  ranking: Address;
  router: Address;
  usdc: Address;
  weth: Address;
  chainId: number;
  bidAsset: BidAsset;
  explorer: string;
  startBlock: bigint;
};

function addr(value: string | undefined): Address | null {
  const trimmed = value?.trim();
  if (!trimmed || !trimmed.startsWith("0x") || trimmed.length !== 42) return null;
  return trimmed as Address;
}

export function ethbidContracts(): EthbidContracts | null {
  const registry = addr(process.env.NEXT_PUBLIC_ETHBID_REGISTRY);
  const ranking = addr(process.env.NEXT_PUBLIC_ETHBID_RANKING);
  const router = addr(process.env.NEXT_PUBLIC_ETHBID_ROUTER);
  const usdc = addr(process.env.NEXT_PUBLIC_ETHBID_USDC);
  const weth = addr(process.env.NEXT_PUBLIC_ETHBID_WETH);
  const chainId = Number(process.env.NEXT_PUBLIC_ETHBID_CHAIN_ID ?? String(DEFAULT_CHAIN_ID));
  if (!registry || !ranking || !router || !usdc || !weth || !Number.isInteger(chainId)) return null;
  const network = networkOrDefault(chainId);
  const startRaw = Number(process.env.NEXT_PUBLIC_ETHBID_START_BLOCK ?? "0");
  const startBlock = Number.isInteger(startRaw) && startRaw >= 0 ? BigInt(startRaw) : 0n;
  return {
    registry,
    ranking,
    router,
    usdc,
    weth,
    chainId,
    bidAsset: network.bidAsset,
    explorer: network.explorer,
    startBlock,
  };
}

export function ethbidConfigured(): boolean {
  return ethbidContracts() !== null;
}
