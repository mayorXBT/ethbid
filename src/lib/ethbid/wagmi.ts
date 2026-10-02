"use client";

import { injected } from "@wagmi/core";
import { http, createConfig } from "wagmi";
import { mainnet } from "wagmi/chains";
import { DEFAULT_CHAIN_ID, ENS_MAINNET_RPC, ETHBID_NETWORKS, networkOrDefault } from "./chains";
import { ethbidContracts } from "./config";

const configured = ethbidContracts();
const settlement = networkOrDefault(configured?.chainId ?? DEFAULT_CHAIN_ID);
const extra = ETHBID_NETWORKS.filter((network) => network.id !== settlement.id && network.id !== mainnet.id);

export const wagmiConfig = createConfig({
  chains: [settlement.chain, mainnet, ...extra.map((network) => network.chain)],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(ENS_MAINNET_RPC),
    ...Object.fromEntries(ETHBID_NETWORKS.map((network) => [network.id, http(network.rpc)])),
  },
  ssr: true,
});
