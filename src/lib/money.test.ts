import { describe, expect, it } from "vitest";
import { formatBid, formatUsdc } from "./money";

describe("formatBid", () => {
  it("suffixes the settlement asset", () => {
    expect(formatBid(5, "USDG")).toBe("$5 USDG");
    expect(formatBid(5, "USDC")).toBe("$5 USDC");
    expect(formatUsdc(5)).toBe("$5 USDC");
  });
});
