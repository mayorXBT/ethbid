"use client";

import { AutoSwitchChain } from "@/components/auto-switch-chain";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/ethbid/wagmi";

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AutoSwitchChain />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
