import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ACTIVE_ROUND,
  CURRENT_LEADERBOARD,
  PREVIOUS_ROUNDS,
  PRODUCT,
  PRODUCT_BID_HISTORY,
  RECENT_BID_ACTIVITY,
  REQUIRED_QUERIES,
  VERIFIED_OWNER,
} from "./queries";

describe("ETHBid GraphQL queries", () => {
  it("exports every query to-build.md section 8 names", () => {
    expect(REQUIRED_QUERIES).toEqual([
      "CurrentLeaderboard",
      "Product",
      "ProductBidHistory",
      "ActiveRound",
      "PreviousRounds",
      "VerifiedOwner",
      "RecentBidActivity",
    ]);
    expect(CURRENT_LEADERBOARD).toContain("CurrentLeaderboard");
    expect(PRODUCT).toContain("Product");
    expect(PRODUCT_BID_HISTORY).toContain("ProductBidHistory");
    expect(ACTIVE_ROUND).toContain("ActiveRound");
    expect(PREVIOUS_ROUNDS).toContain("PreviousRounds");
    expect(VERIFIED_OWNER).toContain("VerifiedOwner");
    expect(RECENT_BID_ACTIVITY).toContain("RecentBidActivity");
  });

  it("keeps the subgraph schema and query file on disk", () => {
    const root = path.resolve(__dirname, "../../..");
    const schema = readFileSync(path.join(root, "subgraph/schema.graphql"), "utf8");
    const queries = readFileSync(path.join(root, "subgraph/queries.graphql"), "utf8");
    expect(schema).toContain("type Project");
    expect(schema).toContain("type Bid");
    expect(schema).toContain("type Round");
    expect(queries).toContain("query CurrentLeaderboard");
  });

  it("pins mainnet contracts and start blocks in subgraph.yaml", () => {
    const root = path.resolve(__dirname, "../../..");
    const yaml = readFileSync(path.join(root, "subgraph/subgraph.yaml"), "utf8");
    expect(yaml).toContain("0x3cC438F47c330AB747cf5404c573156221beD2fD");
    expect(yaml).toContain("0xd010E8bdbd492124aF10D2ac3f025beaC2E9D44C");
    expect(yaml).toContain("startBlock: 25868679");
    expect(yaml).toContain("startBlock: 25868680");
    expect(yaml).toContain("handleRoundStarted");
  });
});
