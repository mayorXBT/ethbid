import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { ENS_MAINNET_RPC } from "@/lib/ethbid/chains";

export function ensMainnetClient() {
  return createPublicClient({
    chain: mainnet,
    transport: http(ENS_MAINNET_RPC),
  });
}
