import { describe, expect, it } from "vitest";
import { listingFromGraphBid, parseGraphBids, unixToIso, usdcToUsd } from "./board";

describe("graph board mapping", () => {
  it("converts canonical USDC units to dollars", () => {
    expect(usdcToUsd("5000000")).toBe(5);
    expect(usdcToUsd("0")).toBe(0);
    expect(usdcToUsd("not-a-number")).toBe(0);
  });

  it("turns subgraph timestamps into ISO", () => {
    expect(unixToIso("1788100103")).toBe("2026-08-30T14:28:23.000Z");
  });

  it("maps a Graph bid onto a listing and keeps ENS verification", () => {
    const [bid] = parseGraphBids([
      {
        id: "0xbid",
        canonicalUsdc: "12000000",
        createdAt: "1788100103",
        txHash: "0xabc",
        project: {
          id: "0x1111111111111111111111111111111111111111111111111111111111111111",
          owner: "0x0F7F971D864360bE5DaA0C23D16A8E25eBe23179",
          verification: "Ens",
          identityRef: "0x2222",
          metadataURI: "https://ghoste.xyz",
        },
      },
    ]);
    expect(bid.project.metadataURI).toBe("https://ghoste.xyz");
    const listing = listingFromGraphBid(bid);
    expect(listing.name).toBe("ghoste.xyz");
    expect(listing.bidUsd).toBe(12);
    expect(listing.verification).toBe("Ens");
    expect(listing.description).toBe("ENS verified");
    expect(listing.url).toBe("https://ghoste.xyz/");
  });
});
