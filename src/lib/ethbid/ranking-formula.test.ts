import { describe, expect, it } from "vitest";
import { rankingFormula, tieBreak } from "./ranking-formula";

describe("ranking formula", () => {
  it("names USDG on the Arbitrum path", () => {
    expect(rankingFormula("USDG")).toBe("score = active canonical USDG bid");
    expect(tieBreak("USDG")[0]).toBe("Higher active USDG bid");
  });

  it("names USDC on the Ethereum path", () => {
    expect(rankingFormula("USDC")).toBe("score = active canonical USDC bid");
    expect(tieBreak("USDC")[0]).toBe("Higher active USDC bid");
  });
});
