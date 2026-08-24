import { describe, expect, it } from "vitest";
import { MIN_NEW_BID_USD } from "./money";
import { quoteBid, rankForBid, rankListings } from "./ranking";
import type { Listing } from "./types";

function listing(partial: Partial<Listing> & Pick<Listing, "id" | "bidUsd" | "createdAt">): Listing {
  return {
    canonicalKey: partial.id,
    url: "https://example.com",
    handle: null,
    name: partial.id,
    description: "",
    faviconUrl: null,
    ogImageUrl: null,
    category: "defi",
    clickCount: 0,
    updatedAt: partial.createdAt,
    ...partial,
  };
}

describe("rankListings", () => {
  it("orders by bid desc, older wins ties", () => {
    const ranked = rankListings([
      listing({ id: "a", bidUsd: 10, createdAt: "2026-08-20T00:00:00.000Z" }),
      listing({ id: "b", bidUsd: 40, createdAt: "2026-08-21T00:00:00.000Z" }),
      listing({ id: "c", bidUsd: 10, createdAt: "2026-08-19T00:00:00.000Z" }),
    ]);
    expect(ranked.map((r) => r.id)).toEqual(["b", "c", "a"]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("prices #1 at top + premium and other ranks at bid + 1", () => {
    const ranked = rankListings([
      listing({ id: "top", bidUsd: 100, createdAt: "2026-08-01T00:00:00.000Z" }),
      listing({ id: "two", bidUsd: 20, createdAt: "2026-08-02T00:00:00.000Z" }),
    ]);
    expect(ranked[0].claimPriceUsd).toBe(101);
    expect(ranked[1].claimPriceUsd).toBe(21);
  });

  it("never prices a claim below the $5 new-listing floor", () => {
    const ranked = rankListings([
      listing({ id: "cheap", bidUsd: 1, createdAt: "2026-08-01T00:00:00.000Z" }),
    ]);
    expect(ranked[0].claimPriceUsd).toBe(MIN_NEW_BID_USD);
  });
});

describe("quoteBid", () => {
  const board = [
    listing({ id: "top", bidUsd: 50, createdAt: "2026-08-01T00:00:00.000Z" }),
  ];

  it("rejects new bids under the $5 floor", () => {
    const q = quoteBid({ listings: board, requestedUsd: 1 });
    expect(q.ok).toBe(false);
    if (!q.ok) expect(q.error).toContain(String(MIN_NEW_BID_USD));
  });

  it("lets a small bid sit at the bottom", () => {
    const q = quoteBid({ listings: board, requestedUsd: 5 });
    expect(q.ok).toBe(true);
    if (q.ok) {
      expect(q.kind).toBe("new");
      expect(q.amountDueUsd).toBe(5);
      expect(q.projectedRank).toBe(2);
    }
  });

  it("raise pays only the difference", () => {
    const existing = listing({ id: "me", bidUsd: 12, createdAt: "2026-08-03T00:00:00.000Z" });
    const q = quoteBid({
      listings: [...board, existing],
      existing,
      requestedUsd: 60,
    });
    expect(q.ok).toBe(true);
    if (q.ok) {
      expect(q.kind).toBe("raise");
      expect(q.amountDueUsd).toBe(48);
      expect(q.projectedRank).toBe(1);
    }
  });
});

describe("rankForBid", () => {
  it("a bid equal to #1 sits below the older listing", () => {
    const listings = [listing({ id: "old", bidUsd: 10, createdAt: "2026-01-01T00:00:00.000Z" })];
    expect(rankForBid(listings, 10, "2026-08-24T00:00:00.000Z")).toBe(2);
  });
});
