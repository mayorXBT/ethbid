import { createPublicClient, http, parseEther } from "viem";
import { mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";
import { USDC, WETH, minOutAfterSlippage, quoteTokenToUsdc } from "./quote-usdc";

describe("minOutAfterSlippage", () => {
  it("cuts 50 bps from the quoted out", () => {
    expect(minOutAfterSlippage(10_000n, 50)).toBe(9950n);
  });

  it("rejects an out-of-range bps", () => {
    expect(() => minOutAfterSlippage(1n, 10_001)).toThrow(/Slippage/);
  });
});

describe("live Uniswap V3 QuoterV2", () => {
  const rpc = process.env.ETH_RPC_URL?.trim() || "https://ethereum-rpc.publicnode.com";
  const client = createPublicClient({
    chain: mainnet,
    transport: http(rpc),
  });

  it("quotes 0.01 WETH into canonical USDC on a V3 pool", async () => {
    const quote = await quoteTokenToUsdc(client, {
      tokenIn: WETH,
      amountIn: parseEther("0.01"),
      slippageBps: 50,
    });
    expect(quote.protocol).toBe("V3");
    expect(quote.tokenOut).toBe(USDC);
    expect(quote.amountOut).toBeGreaterThan(1_000_000n);
    expect(quote.minOut).toBeLessThan(quote.amountOut);
    expect(quote.fee === 500 || quote.fee === 3000 || quote.fee === 10000).toBe(true);
  }, 45_000);
});
