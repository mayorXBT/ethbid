import { describe, expect, it } from "vitest";
import { usesDirectStableBid } from "./chains";
import { bidUnitsFromUsd, isMissingProject, submitEthbidBid } from "./submit";
import type { EthbidContracts } from "./config";
import type { Address, PublicClient, WalletClient } from "viem";

describe("direct USDG bids", () => {
  it("converts whole dollars to 6-decimal units", () => {
    expect(bidUnitsFromUsd(5)).toBe(5_000_000n);
    expect(bidUnitsFromUsd(25)).toBe(25_000_000n);
  });

  it("rejects fractional bids", () => {
    expect(() => bidUnitsFromUsd(5.5)).toThrow(/whole dollar/);
  });

  it("uses approve + placeBid on Arbitrum and Robinhood", () => {
    expect(usesDirectStableBid(421614)).toBe(true);
    expect(usesDirectStableBid(46630)).toBe(true);
    expect(usesDirectStableBid(1)).toBe(false);
  });
});

describe("isMissingProject", () => {
  it("treats UnknownProject and getProject reverts as unregistered", () => {
    expect(isMissingProject(new Error("UnknownProject()"))).toBe(true);
    expect(isMissingProject(new Error('The contract function "getProject" reverted.'))).toBe(true);
  });

  it("does not swallow RPC timeouts as unregistered", () => {
    expect(isMissingProject(new Error("HTTP request failed."))).toBe(false);
    expect(isMissingProject(new Error("The request timed out."))).toBe(false);
  });
});

describe("submitEthbidBid register", () => {
  const contracts = {
    registry: "0x5b185DC5443dca8bda7C4ca7De1a6BcA8d73C2b6",
    ranking: "0x3cC438F47c330AB747cf5404c573156221beD2fD",
    router: "0xd010E8bdbd492124aF10D2ac3f025beaC2E9D44C",
    usdc: "0xFFC95faa3d63Cde504a05B567C600B78C0b41892",
    weth: "0x980B62Da83eFF3D4576C647993b0c1D7faf17c73",
    chainId: 421614,
    bidAsset: "USDG",
    explorer: "https://sepolia.arbiscan.io",
    startBlock: 0n,
  } satisfies EthbidContracts;

  it("simulates register before the wallet send and includes gas", async () => {
    const calls: string[] = [];
    const publicClient = {
      chain: { id: 421614 },
      readContract: async ({ functionName }: { functionName: string }) => {
        calls.push(`read:${functionName}`);
        if (functionName === "getProject") {
          throw new Error('The contract function "getProject" reverted.');
        }
        if (functionName === "balanceOf") return 25_000_000n;
        if (functionName === "allowance") return 25_000_000n;
        throw new Error(functionName);
      },
      simulateContract: async (req: { functionName: string }) => {
        calls.push(`simulate:${req.functionName}`);
        return { request: { ...req } };
      },
      estimateContractGas: async (req: { functionName: string }) => {
        calls.push(`estimate:${req.functionName}`);
        return 111_000n;
      },
      waitForTransactionReceipt: async () => {
        calls.push("receipt");
        return { status: "success" };
      },
    };
    const walletClient = {
      writeContract: async (req: { functionName: string; gas?: bigint }) => {
        calls.push(`write:${req.functionName}`);
        expect(req.gas).toBe(133_200n);
        return "0xabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabca";
      },
    };

    const steps: string[] = [];
    await submitEthbidBid(
      contracts,
      "0x0F7F971D864360bE5DaA0C23D16A8E25eBe23179" as Address,
      publicClient as unknown as PublicClient,
      walletClient as unknown as WalletClient,
      { canonicalKey: "web:new-product.test", url: "https://new-product.test?cat=infra", targetUsdc: 5 },
      (step) => steps.push(step),
    );

    expect(calls).toEqual([
      "read:getProject",
      "simulate:register",
      "estimate:register",
      "write:register",
      "receipt",
      "read:balanceOf",
      "read:allowance",
      "simulate:placeBid",
      "estimate:placeBid",
      "write:placeBid",
      "receipt",
    ]);
    expect(steps).toEqual(["register", "bid", "confirmed"]);
  });
});
