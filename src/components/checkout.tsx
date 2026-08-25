"use client";

import { Button } from "@/components/ui/button";
import { formatUsdc } from "@/lib/money";
import type { Bid } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Status {
  deposits?: { evm: string | null; sol: string | null; error: string | null };
  received?: number;
  settled?: boolean;
  rank?: number | null;
  error?: string;
}

function CopyLine({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <button
        type="button"
        className="w-full truncate border border-line bg-void px-3 py-2 text-left text-xs text-ink hover:border-bid/50"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
      >
        {copied ? "Copied" : value}
      </button>
    </div>
  );
}

export function Checkout({ bid }: { bid: Bid }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({});

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      const res = await fetch(`/api/bids/${bid.id}`);
      const data = (await res.json()) as Status;
      if (cancelled) return;
      setStatus(data);
      if (data.settled) router.push("/?paid=1");
    }
    void tick();
    const id = setInterval(() => void tick(), 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [bid.id, router]);

  const deposits = status.deposits;
  const waiting = !status.settled;

  if (bid.paymentProvider === "moonpay") {
    return (
      <div className="space-y-6">
        <div className="border border-line bg-card p-5">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">MoonPay checkout</p>
          <p className="mt-2 text-3xl tabular-nums text-bid">{formatUsdc(bid.amountDueUsd)}</p>
          <p className="mt-2 truncate text-sm text-muted-foreground">{bid.url}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Pay the exact USDC amount through MoonPay.</p>
        </div>

        {bid.paymentUrl ? (
          <a
            href={bid.paymentUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 w-full items-center justify-center bg-bid px-4 text-sm font-medium text-void hover:bg-bid/90"
          >
            Open MoonPay checkout
          </a>
        ) : (
          <p className="border border-heat/40 bg-heat/10 px-3 py-2 text-sm text-heat">
            MoonPay checkout is not available yet. Refresh this page in a moment.
          </p>
        )}

        {waiting ? (
          <p className="text-sm text-muted-foreground">
            Waiting for MoonPay to confirm the payment. This page checks every 4s.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border border-line bg-card p-5">
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {bid.kind === "raise" ? "Raise" : "New listing"} · send exact amount
        </p>
        <p className="mt-2 text-3xl tabular-nums text-bid">{formatUsdc(bid.amountDueUsd)}</p>
        <p className="mt-2 truncate text-sm text-muted-foreground">{bid.url}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">Target book {formatUsdc(bid.targetBidUsd)}</p>
      </div>

      {deposits?.error ? (
        <p className="border border-heat/40 bg-heat/10 px-3 py-2 text-sm text-heat">{deposits.error}</p>
      ) : null}

      {deposits?.evm ? <CopyLine label="Base USDC" value={deposits.evm} /> : null}
      {deposits?.sol ? <CopyLine label="Solana USDC" value={deposits.sol} /> : null}

      {waiting ? (
        <p className="text-sm text-muted-foreground">
          Rank writes when this exact USDC amount lands. Received {formatUsdc(status.received ?? 0)}.
          Polling every 4s.
        </p>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        size="full"
        onClick={async () => {
          await fetch(`/api/bids/${bid.id}/complete`, { method: "POST" });
          const res = await fetch(`/api/bids/${bid.id}`);
          const data = (await res.json()) as Status;
          setStatus(data);
          if (data.settled) router.push("/?paid=1");
        }}
      >
        I sent it — check now
      </Button>
    </div>
  );
}
