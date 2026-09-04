import { describe, expect, it } from "vitest";
import { rankRows } from "./rank";

describe("ETHBid tie-break", () => {
  it("orders by USDC desc, then earlier bid, then project id", () => {
    const ranked = rankRows([
      { id: "0xbb", canonicalUsdc: 5n, firstBidAt: 10n },
      { id: "0xaa", canonicalUsdc: 5n, firstBidAt: 10n },
      { id: "0xcc", canonicalUsdc: 9n, firstBidAt: 50n },
      { id: "0xdd", canonicalUsdc: 5n, firstBidAt: 8n },
    ]);
    expect(ranked.map((row) => row.id)).toEqual(["0xcc", "0xdd", "0xaa", "0xbb"]);
  });
});
