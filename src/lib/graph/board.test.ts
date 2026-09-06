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
    expect(listing.faviconUrl).toBe("https://euc.li/ghoste.xyz");
    expect(listing.owner).toBe("0x0f7f971d864360be5daa0c23d16a8e25ebe23179");
    expect(listing.category).toBe("infra");
  });

  it("reads category from the registered URL and keeps the ENS mark", () => {
    const [bid] = parseGraphBids([
      {
        id: "0xbid2",
        canonicalUsdc: "5000000",
        createdAt: "1788100103",
        txHash: "0xdef",
        project: {
          id: "0x2222222222222222222222222222222222222222222222222222222222222222",
          owner: "0x8e426701F65f66F5Bec62a0E00a7F5e396900978",
          verification: "Ens",
          identityRef: "0x3333",
          metadataURI: "https://demayor.eth/?cat=social",
        },
      },
    ]);
    const listing = listingFromGraphBid(bid);
    expect(listing.name).toBe("demayor.eth");
    expect(listing.category).toBe("social");
    expect(listing.faviconUrl).toBe("https://euc.li/demayor.eth");
    expect(listing.owner).toBe("0x8e426701f65f66f5bec62a0e00a7f5e396900978");
  });
});
