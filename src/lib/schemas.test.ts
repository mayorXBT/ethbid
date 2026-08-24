import { describe, expect, it } from "vitest";
import { createBidBody } from "./schemas";

describe("createBidBody", () => {
  it("accepts a handle and integer amount", () => {
    const parsed = createBidBody.safeParse({
      target: "@uniswap",
      category: "defi",
      amount: 5,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an oversized target", () => {
    const parsed = createBidBody.safeParse({
      target: "a".repeat(10_000),
      category: "defi",
      amount: 5,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a missing category", () => {
    const parsed = createBidBody.safeParse({
      target: "https://example.com",
      amount: 5,
    });
    expect(parsed.success).toBe(false);
  });
});
