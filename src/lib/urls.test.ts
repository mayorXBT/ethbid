import { describe, expect, it } from "vitest";
import { normalizeTarget } from "./urls";

describe("normalizeTarget", () => {
  it("accepts @handles", () => {
    expect(normalizeTarget("@Phantom")).toEqual({
      url: "https://x.com/phantom",
      canonicalKey: "x:phantom",
      handle: "@phantom",
      host: "x.com",
    });
  });

  it("strips tracking params and www", () => {
    const n = normalizeTarget("https://www.uniswap.org/app?utm_source=x&fbclid=abc");
    expect(n?.url).toBe("https://uniswap.org/app");
    expect(n?.canonicalKey).toBe("web:uniswap.org/app");
  });

  it("keys github by owner/repo", () => {
    const n = normalizeTarget("https://github.com/Uniswap/v3-core/blob/main/README.md");
    expect(n?.canonicalKey).toBe("gh:uniswap/v3-core");
    expect(n?.url).toBe("https://github.com/uniswap/v3-core");
  });

  it("keys app store ids", () => {
    const n = normalizeTarget("https://apps.apple.com/us/app/phantom-crypto-wallet/id1598432977?uo=4");
    expect(n?.canonicalKey).toBe("ios:1598432977");
  });
});
