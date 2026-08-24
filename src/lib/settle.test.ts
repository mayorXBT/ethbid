import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getBid,
  patchBidDeposits,
  applyPaidBid,
  patchListingMeta,
  ensureDepositAddresses,
  receivedUsdc,
  sweepToTreasury,
} = vi.hoisted(() => ({
  getBid: vi.fn(),
  patchBidDeposits: vi.fn(),
  applyPaidBid: vi.fn(),
  patchListingMeta: vi.fn(),
  ensureDepositAddresses: vi.fn(),
  receivedUsdc: vi.fn(),
  sweepToTreasury: vi.fn(),
}));

vi.mock("./store", () => ({
  getBid,
  patchBidDeposits,
  applyPaidBid,
  patchListingMeta,
}));

vi.mock("./crossmint", () => ({
  ensureDepositAddresses,
  receivedUsdc,
  sweepToTreasury,
  paymentCovered: (received: number, due: number) => received + 0.000001 >= due,
}));

import { settleIfFunded } from "./settle";

describe("settleIfFunded", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getBid.mockResolvedValue({
      id: "22a18bac-3bb4-4c0c-b4b9-2f78a9bfb4ea",
      status: "paid",
      amountDueUsd: 1,
      depositEvm: "0xdeposit",
      depositSol: "soldeposit",
    });
    ensureDepositAddresses.mockResolvedValue({
      evm: "0xdeposit",
      sol: "soldeposit",
      error: null,
    });
    receivedUsdc.mockResolvedValue(1.027509);
    sweepToTreasury.mockResolvedValue({ attempted: true, errors: [] });
  });

  it("retries the treasury sweep for an already-paid funded bid", async () => {
    const result = await settleIfFunded("22a18bac-3bb4-4c0c-b4b9-2f78a9bfb4ea");

    expect(result.settled).toBe(true);
    expect(receivedUsdc).toHaveBeenCalledWith({ evm: "0xdeposit", sol: "soldeposit", error: null });
    expect(sweepToTreasury).toHaveBeenCalledWith(
      { evm: "0xdeposit", sol: "soldeposit", error: null },
      1,
    );
    expect(applyPaidBid).not.toHaveBeenCalled();
  });
});
