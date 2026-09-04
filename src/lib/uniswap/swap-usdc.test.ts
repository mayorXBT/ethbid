import { createPublicClient, http, parseEther } from "viem";
import { mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";
import { USDC, WETH, quoteTokenToUsdc } from "./quote-usdc";
import { SWAP_ROUTER_02, buildSwapToUsdc, simulateSwapToUsdc } from "./swap-usdc";

const FUNDED = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as const;

describe("buildSwapToUsdc", () => {
  it("targets SwapRouter02 with ETH value when tokenIn is WETH", () => {
    const tx = buildSwapToUsdc(
      {
        protocol: "V3",
        tokenIn: WETH,
        tokenOut: USDC,
        amountIn: 10n ** 16n,
        amountOut: 20_000_000n,
        fee: 500,
        minOut: 19_900_000n,
        slippageBps: 50,
      },
      FUNDED,
    );
    expect(tx.to).toBe(SWAP_ROUTER_02);
    expect(tx.tokenOut).toBe(USDC);
    expect(tx.value).toBe(10n ** 16n);
    expect(tx.data.startsWith("0x")).toBe(true);
    expect(tx.data.length).toBeGreaterThan(10);
  });
});

describe("live SwapRouter02 conversion", () => {
  const rpc = process.env.ETH_RPC_URL?.trim() || "https://ethereum-rpc.publicnode.com";
  const client = createPublicClient({
    chain: mainnet,
    transport: http(rpc),
  });

  it("simulates exactInputSingle of 0.01 ETH into USDC on the quoted V3 pool", async () => {
    const quote = await quoteTokenToUsdc(client, {
      tokenIn: WETH,
      amountIn: parseEther("0.01"),
      slippageBps: 100,
    });
    const { amountOut, tx } = await simulateSwapToUsdc(client, {
      account: FUNDED,
      quote,
      recipient: FUNDED,
    });
    expect(tx.to).toBe(SWAP_ROUTER_02);
    expect(tx.value).toBe(parseEther("0.01"));
    expect(amountOut).toBeGreaterThan(1_000_000n);
    expect(amountOut).toBeGreaterThanOrEqual(quote.minOut);
  }, 60_000);
});
