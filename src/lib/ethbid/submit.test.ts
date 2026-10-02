import { describe, expect, it } from "vitest";
import { usesDirectStableBid } from "./chains";
import { bidUnitsFromUsd } from "./submit";

describe("direct USDG bids", () => {
  it("converts whole dollars to 6-decimal units", () => {
    expect(bidUnitsFromUsd(5)).toBe(5_000_000n);
    expect(bidUnitsFromUsd(25)).toBe(25_000_000n);
  });

  it("rejects fractional bids", () => {
    expect(() => bidUnitsFromUsd(5.5)).toThrow(/whole dollar/);
  });

  it("uses approve + placeBid on Arbitrum and Robinhood", () => {
    expect(usesDirectStableBid(421614)).toBe(true);
    expect(usesDirectStableBid(46630)).toBe(true);
    expect(usesDirectStableBid(1)).toBe(false);
  });
});
