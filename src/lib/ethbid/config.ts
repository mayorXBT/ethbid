import type { Address } from "viem";

export type EthbidContracts = {
  registry: Address;
  ranking: Address;
  router: Address;
  usdc: Address;
  weth: Address;
  chainId: number;
};

function addr(name: string): Address | null {
  const value = process.env[name]?.trim();
  if (!value || !value.startsWith("0x") || value.length !== 42) return null;
  return value as Address;
}

export function ethbidContracts(): EthbidContracts | null {
  const registry = addr("NEXT_PUBLIC_ETHBID_REGISTRY");
  const ranking = addr("NEXT_PUBLIC_ETHBID_RANKING");
  const router = addr("NEXT_PUBLIC_ETHBID_ROUTER");
  const usdc = addr("NEXT_PUBLIC_ETHBID_USDC");
  const weth = addr("NEXT_PUBLIC_ETHBID_WETH");
  const chainId = Number(process.env.NEXT_PUBLIC_ETHBID_CHAIN_ID ?? "1");
  if (!registry || !ranking || !router || !usdc || !weth || !Number.isInteger(chainId)) return null;
  return { registry, ranking, router, usdc, weth, chainId };
}

export function ethbidConfigured(): boolean {
  return ethbidContracts() !== null;
}
