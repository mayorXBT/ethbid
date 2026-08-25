import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createWallet: vi.fn(),
  getWallet: vi.fn(),
  useSigner: vi.fn(),
  send: vi.fn(),
}));

vi.mock("@crossmint/wallets-sdk", () => ({
  createCrossmint: vi.fn(() => ({})),
  CrossmintWallets: {
    from: vi.fn(() => ({
      createWallet: mocks.createWallet,
      getWallet: mocks.getWallet,
    })),
  },
}));

import { ensureDepositAddresses, serverSignerConfigured, sweepToTreasury } from "./crossmint";

const original = { ...process.env };

afterEach(() => {
  vi.clearAllMocks();
  for (const key of Object.keys(process.env)) {
    if (!(key in original)) delete process.env[key];
  }
  Object.assign(process.env, original);
});

describe("Crossmint server signer", () => {
  it("requires a signer secret for server settlement", () => {
    process.env.CROSSMINT_API_KEY = "sk_production_test";
    delete process.env.CROSSMINT_SIGNER_SECRET;

    expect(serverSignerConfigured()).toBe(false);
  });

  it("creates new deposit wallets with server recovery", async () => {
    process.env.CROSSMINT_API_KEY = "sk_production_test";
    process.env.CROSSMINT_SIGNER_SECRET = "a".repeat(64);
    mocks.createWallet
      .mockResolvedValueOnce({ address: "0xbase" })
      .mockResolvedValueOnce({ address: "solana-address" });

    const result = await ensureDepositAddresses({
      id: "11111111-1111-4111-8111-111111111111",
      depositEvm: null,
      depositSol: null,
    } as never);

    expect(result).toEqual({ evm: "0xbase", sol: "solana-address", error: null });
    expect(mocks.createWallet).toHaveBeenNthCalledWith(1, expect.objectContaining({
      chain: "base",
      recovery: { type: "server", secret: "a".repeat(64) },
    }));
    expect(mocks.createWallet).toHaveBeenNthCalledWith(2, expect.objectContaining({
      chain: "solana",
      recovery: { type: "server", secret: "a".repeat(64) },
    }));
  });

  it("sweeps through the active server signer", async () => {
    process.env.CROSSMINT_API_KEY = "sk_production_test";
    process.env.CROSSMINT_SIGNER_SECRET = "b".repeat(64);
    process.env.CROSSMINT_TREASURY_EVM = "0xtreasury";
    process.env.CROSSMINT_TREASURY_SOL = "sol-treasury";
    mocks.getWallet.mockImplementation(async () => ({
      useSigner: mocks.useSigner,
      send: mocks.send,
    }));
    mocks.send.mockResolvedValue({ hash: "0xtx", explorerLink: "https://explorer/tx" });

    const result = await sweepToTreasury(
      { evm: "0xdeposit", sol: "sol-deposit", error: null },
      5,
    );

    expect(result).toEqual({ attempted: true, errors: [] });
    expect(mocks.useSigner).toHaveBeenCalledWith({ type: "server", secret: "b".repeat(64) });
    expect(mocks.send).toHaveBeenCalledWith("0xtreasury", "usdc", "5");
    expect(mocks.send).toHaveBeenCalledWith("sol-treasury", "usdc", "5");
  });
});
