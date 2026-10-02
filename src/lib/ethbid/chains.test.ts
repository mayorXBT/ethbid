import { describe, expect, it } from "vitest";
import {
  DEFAULT_CHAIN_ID,
  explorerAddressUrl,
  networkById,
  networkOrDefault,
  usesDirectStableBid,
} from "./chains";

describe("ETHBid networks", () => {
  it("defaults to Arbitrum Sepolia", () => {
    expect(DEFAULT_CHAIN_ID).toBe(421614);
    expect(networkById(421614).bidAsset).toBe("USDG");
    expect(networkById(421614).bidToken).toBe("0xFFC95faa3d63Cde504a05B567C600B78C0b41892");
  });

  it("keeps Ethereum for ENS and historical USDC settlement", () => {
    expect(networkById(1).bidAsset).toBe("USDC");
    expect(usesDirectStableBid(1)).toBe(false);
    expect(usesDirectStableBid(421614)).toBe(true);
  });

  it("builds Arbiscan links", () => {
    expect(explorerAddressUrl(421614, "0xabc")).toBe("https://sepolia.arbiscan.io/address/0xabc");
    expect(networkOrDefault(999999).id).toBe(421614);
  });
});
