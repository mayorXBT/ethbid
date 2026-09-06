"use client";

import { injected } from "@wagmi/core";
import { http, createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { ethbidContracts } from "./config";

const chainId = ethbidContracts()?.chainId ?? 1;
const chain = chainId === 1 ? mainnet : sepolia;
const mainnetRpc =
  process.env.NEXT_PUBLIC_ETH_RPC_URL?.trim() || "https://ethereum-rpc.publicnode.com";
const sepoliaRpc =
  process.env.NEXT_PUBLIC_ETH_SEPOLIA_RPC_URL?.trim() ||
  "https://ethereum-sepolia-rpc.publicnode.com";

export const wagmiConfig = createConfig({
  chains: [chain, chain === sepolia ? mainnet : sepolia],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(mainnetRpc),
    [sepolia.id]: http(sepoliaRpc),
  },
  ssr: true,
});
