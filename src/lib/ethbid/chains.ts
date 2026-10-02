import { defineChain, type Address, type Chain } from "viem";
import { arbitrum, arbitrumSepolia, mainnet } from "viem/chains";

export const robinhoodTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.chain.robinhood.com"] },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Explorer",
      url: "https://explorer.testnet.chain.robinhood.com",
    },
  },
});

export type BidAsset = "USDG" | "USDC";

export type EthbidNetwork = {
  id: number;
  slug: "arbitrum-sepolia" | "arbitrum" | "robinhood-testnet" | "ethereum";
  label: string;
  chain: Chain;
  rpc: string;
  explorer: string;
  bidAsset: BidAsset;
  bidToken: Address;
  weth: Address;
  swapRouter: Address;
  faucetEth?: string;
  faucetStable?: string;
  faucetCircle?: string;
};

export const DEFAULT_CHAIN_ID = 421614;

export const ETHBID_NETWORKS: readonly EthbidNetwork[] = [
  {
    id: 421614,
    slug: "arbitrum-sepolia",
    label: "Arbitrum Sepolia",
    chain: arbitrumSepolia,
    rpc: "https://sepolia-rollup.arbitrum.io/rpc",
    explorer: "https://sepolia.arbiscan.io",
    bidAsset: "USDG",
    bidToken: "0xFFC95faa3d63Cde504a05B567C600B78C0b41892",
    weth: "0x980B62Da83eFF3D4576C647993b0c1D7faf17c73",
    swapRouter: "0x101F443B4d1b059569D643917553c771E1b9663E",
    faucetEth: "https://arbitrum.faucet.dev",
    faucetStable: "https://faucet.paxos.com",
    faucetCircle: "https://faucet.circle.com",
  },
  {
    id: 42161,
    slug: "arbitrum",
    label: "Arbitrum One",
    chain: arbitrum,
    rpc: "https://arb1.arbitrum.io/rpc",
    explorer: "https://arbiscan.io",
    bidAsset: "USDG",
    bidToken: "0x004B506865409877C9fA29bfb1ebA929984B9bbC",
    weth: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    swapRouter: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  },
  {
    id: 46630,
    slug: "robinhood-testnet",
    label: "Robinhood Chain Testnet",
    chain: robinhoodTestnet,
    rpc: "https://rpc.testnet.chain.robinhood.com",
    explorer: "https://explorer.testnet.chain.robinhood.com",
    bidAsset: "USDG",
    bidToken: "0x7E955252E15c84f5768B83c41a71F9eba181802F",
    weth: "0x980B62Da83eFF3D4576C647993b0c1D7faf17c73",
    swapRouter: "0xcaf681a66d020601342297493863e78c959e5cb2",
    faucetEth: "https://faucet.testnet.chain.robinhood.com",
    faucetStable: "https://faucet.paxos.com",
  },
  {
    id: 1,
    slug: "ethereum",
    label: "Ethereum",
    chain: mainnet,
    rpc: "https://ethereum-rpc.publicnode.com",
    explorer: "https://etherscan.io",
    bidAsset: "USDC",
    bidToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    swapRouter: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  },
];

const byId = new Map(ETHBID_NETWORKS.map((network) => [network.id, network]));

export function networkById(chainId: number): EthbidNetwork {
  const network = byId.get(chainId);
  if (!network) {
    throw new Error(`Unsupported ETHBid chain ${chainId}.`);
  }
  return network;
}

export function networkOrDefault(chainId: number): EthbidNetwork {
  return byId.get(chainId) ?? networkById(DEFAULT_CHAIN_ID);
}

export function explorerAddressUrl(chainId: number, address: string): string {
  return `${networkOrDefault(chainId).explorer}/address/${address}`;
}

export function explorerTxUrl(chainId: number, hash: string): string {
  return `${networkOrDefault(chainId).explorer}/tx/${hash}`;
}

export function usesDirectStableBid(chainId: number): boolean {
  return chainId !== 1;
}

export const ENS_MAINNET_RPC =
  process.env.NEXT_PUBLIC_ETH_RPC_URL?.trim() || "https://ethereum-rpc.publicnode.com";
