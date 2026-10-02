"use client";

import { ethbidContracts } from "@/lib/ethbid/config";
import { useEffect, useRef } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";

export function AutoSwitchChain() {
  const targetChainId = ethbidContracts()?.chainId;
  const walletChainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const promptedFor = useRef<number | null>(null);

  useEffect(() => {
    if (!isConnected) {
      promptedFor.current = null;
      return;
    }
    if (!targetChainId || !switchChain || walletChainId === targetChainId) return;
    if (promptedFor.current === targetChainId) return;
    promptedFor.current = targetChainId;
    try {
      const result = switchChain({ chainId: targetChainId });
      void Promise.resolve(result).catch(() => undefined);
    } catch {
      return;
    }
  }, [isConnected, targetChainId, walletChainId, switchChain]);

  return null;
}
