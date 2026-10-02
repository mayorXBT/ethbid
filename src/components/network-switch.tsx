"use client";

import { ethbidContracts } from "@/lib/ethbid/config";
import { networkOrDefault } from "@/lib/ethbid/chains";
import { useAccount, useChainId, useSwitchChain } from "wagmi";

export function NetworkSwitch() {
  const contracts = ethbidContracts();
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChain, isPending, error } = useSwitchChain();
  if (!contracts) return null;
  const network = networkOrDefault(contracts.chainId);
  if (!isConnected) {
    return (
      <span className="hidden text-[11px] uppercase tracking-[0.14em] text-muted-foreground sm:inline">
        {network.label}
      </span>
    );
  }
  if (chainId === contracts.chainId) {
    return (
      <span className="text-[11px] uppercase tracking-[0.14em] text-bid">{network.label}</span>
    );
  }
  return (
    <button
      type="button"
      aria-label={`Switch to ${network.label}`}
      disabled={isPending}
      title={error?.message}
      onClick={() => switchChain({ chainId: contracts.chainId })}
      className="inline-flex h-8 items-center border border-heat px-2 text-[11px] uppercase tracking-[0.14em] text-heat hover:bg-heat/10 disabled:opacity-40"
    >
      {isPending ? "Switching" : `Switch to ${network.label}`}
    </button>
  );
}
