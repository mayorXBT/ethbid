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
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not open checkout.");
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
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
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

      <div className="flex items-center gap-2 border border-line bg-panel px-3 py-2">
        <button
          type="button"
          aria-label="Decrease bid"
          className="flex h-9 w-9 items-center justify-center border border-line text-lg text-muted-foreground hover:border-bid hover:text-bid"
          onClick={() => setBid(amount - 1)}
        >
          −
        </button>
        <label className="min-w-32 px-1 text-center">
          <span className="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Bid</span>
          <span className="flex items-baseline justify-center text-bid">
            <span className="text-lg">$</span>
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
              className="bg-transparent text-center text-2xl tabular-nums outline-none"
            />
          </span>
        </label>
        <button
          type="button"
          aria-label="Increase bid"
          className="flex h-9 w-9 items-center justify-center border border-line text-lg text-muted-foreground hover:border-bid hover:text-bid"
          onClick={() => setBid(amount + 1)}
        >
          +
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_180px_auto] lg:col-span-2">
        <Input name="target" required placeholder="product URL or @handle" autoComplete="url" />
        <Select name="category" required defaultValue="">
          <option value="" disabled>
            Category
          </option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </Select>
        <Button type="submit" disabled={pending} className="h-11 px-8">
          {pending ? "Opening…" : "Place bid"}
        </Button>
      </div>
      {error ? (
        <p className="text-xs text-heat lg:col-span-2">{error}</p>
      ) : (
        <p className="text-[11px] text-muted-foreground lg:col-span-2">
          Already listed? Same URL or @handle. You only pay the difference.
        </p>
      )}
    </form>
  );
}
