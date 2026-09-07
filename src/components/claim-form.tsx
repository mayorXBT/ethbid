"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CATEGORIES, isCategory } from "@/lib/categories";
import { ethbidConfigured, ethbidContracts } from "@/lib/ethbid/config";
import { plainEthbidError } from "@/lib/ethbid/errors";
import { submitEthbidBid, type EthbidStep } from "@/lib/ethbid/submit";
import { MAX_BID_USD, MIN_NEW_BID_USD, parseUsd } from "@/lib/money";
import { normalizeTarget, withCategory } from "@/lib/urls";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

export function ClaimForm({ defaultBid }: { defaultBid: number }) {
  const params = useSearchParams();
  const min = MIN_NEW_BID_USD;
  const seeded = Number(params.get("amount") ?? "");
  const start = Number.isFinite(seeded) && seeded >= min ? seeded : defaultBid;
  const [amount, setAmount] = useState(start);
  const [draft, setDraft] = useState(String(start));
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [target, setTarget] = useState("");
  const onchain = ethbidConfigured();
  const biddingOpen = onchain;
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  function setBid(n: number) {
    const next = Math.min(MAX_BID_USD, Math.max(min, Math.floor(n)));
    setAmount(next);
    setDraft(String(next));
  }

  function commitDraft() {
    const parsed = parseUsd(draft);
    setBid(parsed ?? min);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const parsed = parseUsd(draft);
    const bidUsd = Math.min(MAX_BID_USD, Math.max(min, parsed ?? amount));
    setBid(bidUsd);
    try {
      const contracts = ethbidContracts();
      const rawTarget = String(form.get("target") ?? "");
      const listing = normalizeTarget(rawTarget);
      const category = String(form.get("category") ?? "");
      if (!listing) throw new Error("Need a real URL, domain, or @handle.");
      if (!isCategory(category)) throw new Error("Pick a category.");
      if (!isConnected || !address) throw new Error("Connect a wallet first.");
      if (!contracts) throw new Error("ETHBid contracts are not deployed yet.");
      if (!publicClient || !walletClient) throw new Error("Wallet client is not ready.");
      const { hash } = await submitEthbidBid(
        contracts,
        address,
        publicClient,
        walletClient,
        {
          canonicalKey: listing.canonicalKey,
          url: withCategory(listing.url, category),
          targetUsdc: bidUsd,
        },
        (step) => {
          const copy = {
            register: "Registering the product…",
            swap: "Swapping to USDC…",
            confirmed: "Confirmed.",
          } satisfies Record<EthbidStep, string>;
          setStatus(copy[step]);
        },
      );
      setStatus(`Confirmed. ${hash.slice(0, 10)}…`);
    } catch (err) {
      setError(plainEthbidError(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-bid">Onchain discovery</p>
        <h1 className="mt-2 text-[2rem] font-semibold tracking-tight text-foreground sm:text-5xl">
          Rank is the bid.
        </h1>
        <p className="mt-3 max-w-lg text-sm text-muted-foreground">
          Connect a wallet. Bid through Uniswap into canonical USDC.
          Rank is public on The Graph. Floor ${min} USDC.
        </p>
      </div>

      <div className="grid gap-2">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-[minmax(0,1fr)_10.5rem_auto_auto] md:items-center">
          <div className="col-span-2 md:col-span-1">
            <Input
              name="target"
              required
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="product URL or domain"
              autoComplete="url"
              className="h-12 rounded-xl px-4"
            />
          </div>
          <div className="relative">
            <Select
              name="category"
              required
              defaultValue=""
              className="h-12 rounded-xl px-4 pr-10"
            >
              <option value="" disabled>
                Category
              </option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </Select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
          <div className="flex h-12 items-center gap-1 rounded-xl border border-line bg-panel px-1.5">
            <button
              type="button"
              aria-label="Decrease bid"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg text-muted-foreground hover:text-bid"
              onClick={() => setBid(amount - 1)}
            >
              −
            </button>
            <label className="min-w-[4.5rem] px-1 text-center">
              <span className="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Bid</span>
              <span className="flex items-baseline justify-center text-bid">
                <span className="text-sm">$</span>
                <input
                  name="amount"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-label="Bid amount in USDC"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
                  onBlur={commitDraft}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitDraft();
                    }
                  }}
                  style={{ width: `${Math.max(2, draft.length || 1)}ch` }}
                  className="bg-transparent text-center text-xl tabular-nums outline-none"
                />
              </span>
            </label>
            <button
              type="button"
              aria-label="Increase bid"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg text-muted-foreground hover:text-bid"
              onClick={() => setBid(amount + 1)}
            >
              +
            </button>
          </div>
          <Button
            type="submit"
            disabled={pending || !biddingOpen}
            aria-label={biddingOpen ? "Place bid" : "Coming soon"}
            className={`relative col-span-2 h-12 rounded-full px-8 md:col-span-1 ${biddingOpen ? "" : "!text-transparent"}`}
          >
            <span aria-hidden="true" className={biddingOpen ? "hidden" : "absolute text-foreground"}>
              Coming soon
            </span>
            {pending ? "Submitting…" : "Place bid"}
          </Button>
        </div>
      </div>
      {error ? (
        <p className="text-xs text-heat">{error}</p>
      ) : status ? (
        <p className="text-xs text-bid">{status}</p>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Connect a wallet. Bid in ETH. Uniswap converts to USDC onchain.
        </p>
      )}
    </form>
  );
}
