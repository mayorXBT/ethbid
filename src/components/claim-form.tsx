"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/categories";
import { MAX_BID_USD, MIN_NEW_BID_USD, parseUsd } from "@/lib/money";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export function ClaimForm({ defaultBid }: { defaultBid: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const seeded = Number(params.get("amount") ?? "");
  const start = Number.isFinite(seeded) && seeded >= 1 ? seeded : defaultBid;
  const [amount, setAmount] = useState(start);
  const [draft, setDraft] = useState(String(start));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const min = MIN_NEW_BID_USD;

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
    setPending(true);
    const form = new FormData(e.currentTarget);
    const parsed = parseUsd(draft);
    const bidUsd = Math.min(MAX_BID_USD, Math.max(min, parsed ?? amount));
    setBid(bidUsd);
    try {
      const res = await fetch("/api/bids", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          target: String(form.get("target") ?? ""),
          category: String(form.get("category") ?? ""),
          amount: bidUsd,
        }),
      });
      const text = await res.text();
      let data: { error?: string; bid?: { id?: string } } = {};
      try {
        data = JSON.parse(text) as { error?: string; bid?: { id?: string } };
      } catch {
        setError("Could not open checkout.");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Could not open checkout.");
        return;
      }
      if (!data.bid?.id) {
        setError("Could not open checkout.");
        return;
      }
      router.push(`/pay/${data.bid.id}`);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-bid">Crypto products only</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Rank is the bid.
        </h1>
        <p className="mt-3 max-w-lg text-sm text-muted-foreground">
          Pay more. Rank higher. Floor ${min} USDC. Paying under #1 still puts you on the book
          at whatever rank that size can take.
        </p>
      </div>

      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_10.5rem_auto_auto] md:items-center">
        <Input
          name="target"
          required
          placeholder="product URL or @handle"
          autoComplete="url"
          className="h-12 rounded-xl px-4"
        />
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
        <Button type="submit" disabled={pending} className="h-12 rounded-full px-8">
          {pending ? "Opening…" : "Place bid"}
        </Button>
      </div>
      {error ? (
        <p className="text-xs text-heat">{error}</p>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Already listed? Same URL or @handle. You only pay the difference.
        </p>
      )}
    </form>
  );
}
