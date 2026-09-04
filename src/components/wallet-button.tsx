"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const injected = connectors.find((c) => c.id === "injected") ?? connectors[0];

  if (isConnected && address) {
    return (
      <button
        type="button"
        aria-label="Disconnect wallet"
        onClick={() => disconnect()}
        className="inline-flex h-8 items-center border border-line px-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground hover:border-bid hover:text-bid"
      >
        {address.slice(0, 6)}…{address.slice(-4)}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label="Connect wallet"
      disabled={!injected || isPending}
      onClick={() => injected && connect({ connector: injected })}
      title={error?.message}
      className="inline-flex h-8 items-center border border-line px-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground hover:border-bid hover:text-bid disabled:opacity-40"
    >
      {isPending ? "Connecting" : "Connect"}
    </button>
  );
}
