import { afterEach, describe, expect, it } from "vitest";
import { reconstructFrom, settlementCopy, shareDescription, siteDescription } from "./copy";

const original = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in original)) delete process.env[key];
  }
  Object.assign(process.env, original);
});

describe("settlementCopy", () => {
  it("uses USDG, Arbiscan, and a Sepolia badge on 421614", () => {
    process.env.NEXT_PUBLIC_ETHBID_CHAIN_ID = "421614";
    const copy = settlementCopy();
    expect(copy.chainId).toBe(421614);
    expect(copy.label).toBe("Arbitrum Sepolia");
    expect(copy.asset).toBe("USDG");
    expect(copy.explorer).toBe("https://sepolia.arbiscan.io");
    expect(copy.isTestnet).toBe(true);
    expect(copy.testnetBadge).toBe("Arbitrum Sepolia testnet");
    expect(copy.faucetStable).toBe("https://faucet.paxos.com");
    expect(shareDescription(copy)).not.toMatch(/The Graph/);
    expect(siteDescription(copy)).toContain("USDG");
    expect(siteDescription(copy)).toContain("Arbitrum Sepolia");
    expect(reconstructFrom(copy)).toBe("the contracts and event logs");
  });

  it("uses USDC, Etherscan, and no badge on Ethereum mainnet", () => {
    process.env.NEXT_PUBLIC_ETHBID_CHAIN_ID = "1";
    const copy = settlementCopy();
    expect(copy.chainId).toBe(1);
    expect(copy.label).toBe("Ethereum");
    expect(copy.asset).toBe("USDC");
    expect(copy.explorer).toBe("https://etherscan.io");
    expect(copy.isTestnet).toBe(false);
    expect(copy.testnetBadge).toBeNull();
    expect(copy.faucetStable).toBeUndefined();
    expect(shareDescription(copy)).toMatch(/The Graph/);
    expect(siteDescription(copy)).toContain("USDC");
    expect(siteDescription(copy)).toContain("Ethereum");
    expect(reconstructFrom(copy)).toBe("the contracts and The Graph");
  });

  it("marks Robinhood testnet without treating Arbitrum One as testnet", () => {
    process.env.NEXT_PUBLIC_ETHBID_CHAIN_ID = "46630";
    const robinhood = settlementCopy();
    expect(robinhood.isTestnet).toBe(true);
    expect(robinhood.testnetBadge).toBe("Robinhood Chain testnet");

    process.env.NEXT_PUBLIC_ETHBID_CHAIN_ID = "42161";
    const one = settlementCopy();
    expect(one.isTestnet).toBe(false);
    expect(one.testnetBadge).toBeNull();
    expect(one.asset).toBe("USDG");
  });
});
