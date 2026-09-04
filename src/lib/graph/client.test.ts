import { describe, expect, it } from "vitest";
import { graphEndpoint } from "./client";

describe("graph client", () => {
  it("refuses to query without GRAPH_SUBGRAPH_URL", () => {
    expect(() => graphEndpoint()).toThrow(/GRAPH_SUBGRAPH_URL/);
  });
});
