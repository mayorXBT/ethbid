import { type Address, type PublicClient, parseAbi } from "viem";

/** Uniswap V3 Quoter (periphery), Ethereum mainnet. */
export const QUOTER_V3 = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6" as const;
export const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as const;
export const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const;

const FEE_TIERS = [500, 3000, 10000] as const;

const quoterAbi = parseAbi([
  "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) returns (uint256 amountOut)",
]);

export type UsdcQuote = {
  protocol: "V3";
  tokenIn: Address;
  tokenOut: typeof USDC;
  amountIn: bigint;
  amountOut: bigint;
  fee: number;
  minOut: bigint;
  slippageBps: number;
};

export function minOutAfterSlippage(amountOut: bigint, slippageBps: number): bigint {
  if (slippageBps < 0 || slippageBps > 10_000) {
    throw new Error("Slippage must be between 0 and 10000 bps.");
  }
  return (amountOut * BigInt(10_000 - slippageBps)) / 10_000n;
}

export async function quoteTokenToUsdc(
  client: PublicClient,
  opts: {
    tokenIn?: Address;
    amountIn: bigint;
    slippageBps?: number;
  },
): Promise<UsdcQuote> {
  if (opts.amountIn <= 0n) throw new Error("amountIn must be positive.");
  const tokenIn = opts.tokenIn ?? WETH;
  const slippageBps = opts.slippageBps ?? 50;
  let best: UsdcQuote | null = null;

  for (const fee of FEE_TIERS) {
    try {
      const { result: amountOut } = await client.simulateContract({
        address: QUOTER_V3,
        abi: quoterAbi,
        functionName: "quoteExactInputSingle",
        args: [tokenIn, USDC, fee, opts.amountIn, 0n],
      });
      if (!best || amountOut > best.amountOut) {
        best = {
          protocol: "V3",
          tokenIn,
          tokenOut: USDC,
          amountIn: opts.amountIn,
          amountOut,
          fee,
          minOut: minOutAfterSlippage(amountOut, slippageBps),
          slippageBps,
        };
      }
    } catch {
      // pool missing at this fee
    }
  }

  if (!best) {
    throw new Error("No Uniswap V3 USDC pool quoted for this token.");
  }
  return best;
}
