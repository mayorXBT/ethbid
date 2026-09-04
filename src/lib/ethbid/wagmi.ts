"use client";

import { injected } from "@wagmi/core";
import { http, createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { ethbidContracts } from "./config";

const chainId = ethbidContracts()?.chainId ?? 1;
const chain = chainId === 1 ? mainnet : sepolia;

export const wagmiConfig = createConfig({
  chains: [chain, chain === sepolia ? mainnet : sepolia],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});
