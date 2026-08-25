import { afterEach, describe, expect, it } from "vitest";
import { bidsEnabled } from "./bids-config";

const previous = process.env.NEXT_PUBLIC_BIDS_ENABLED;

afterEach(() => {
  if (previous === undefined) delete process.env.NEXT_PUBLIC_BIDS_ENABLED;
  else process.env.NEXT_PUBLIC_BIDS_ENABLED = previous;
});

describe("bidsEnabled", () => {
  it("keeps bidding disabled unless explicitly enabled", () => {
    delete process.env.NEXT_PUBLIC_BIDS_ENABLED;

    expect(bidsEnabled()).toBe(false);
  });

  it("enables bidding only for the explicit true value", () => {
    process.env.NEXT_PUBLIC_BIDS_ENABLED = "true";

    expect(bidsEnabled()).toBe(true);
  });
});
