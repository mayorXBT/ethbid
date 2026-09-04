import { describe, expect, it } from "vitest";
import { ethbidConfigured, ethbidContracts } from "./config";

describe("ethbid config", () => {
  const keys = [
    "NEXT_PUBLIC_ETHBID_REGISTRY",
    "NEXT_PUBLIC_ETHBID_RANKING",
    "NEXT_PUBLIC_ETHBID_ROUTER",
    "NEXT_PUBLIC_ETHBID_USDC",
    "NEXT_PUBLIC_ETHBID_WETH",
    "NEXT_PUBLIC_ETHBID_CHAIN_ID",
  ] as const;

  it("stays off when contract env is empty", () => {
    const prev = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
    for (const key of keys) delete process.env[key];
    try {
      expect(ethbidContracts()).toBeNull();
      expect(ethbidConfigured()).toBe(false);
    } finally {
      for (const key of keys) {
        if (prev[key] === undefined) delete process.env[key];
        else process.env[key] = prev[key];
      }
    }
  });
});
