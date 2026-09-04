import {
  type Address,
  type PublicClient,
  encodeFunctionData,
  parseAbi,
} from "viem";
import { USDC, WETH, type UsdcQuote } from "./quote-usdc";

/** Uniswap V3 SwapRouter02, Ethereum mainnet. */
export const SWAP_ROUTER_02 = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45" as const;

const swapRouterAbi = parseAbi([
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountOut)",
]);

export type SwapTx = {
  to: typeof SWAP_ROUTER_02;
  data: `0x${string}`;
  value: bigint;
  protocol: "V3";
  tokenOut: typeof USDC;
  minOut: bigint;
};

export function buildSwapToUsdc(quote: UsdcQuote, recipient: Address): SwapTx {
  const data = encodeFunctionData({
    abi: swapRouterAbi,
    functionName: "exactInputSingle",
    args: [
      {
        tokenIn: quote.tokenIn,
        tokenOut: USDC,
        fee: quote.fee,
        recipient,
        amountIn: quote.amountIn,
        amountOutMinimum: quote.minOut,
        sqrtPriceLimitX96: 0n,
      },
    ],
  });
  return {
    to: SWAP_ROUTER_02,
    data,
    value: quote.tokenIn.toLowerCase() === WETH.toLowerCase() ? quote.amountIn : 0n,
    protocol: "V3",
    tokenOut: USDC,
    minOut: quote.minOut,
  };
}

export async function simulateSwapToUsdc(
  client: PublicClient,
  opts: { account: Address; quote: UsdcQuote; recipient?: Address },
): Promise<{ amountOut: bigint; tx: SwapTx }> {
  const recipient = opts.recipient ?? opts.account;
  const tx = buildSwapToUsdc(opts.quote, recipient);
  const { result } = await client.simulateContract({
    account: opts.account,
    address: SWAP_ROUTER_02,
    abi: swapRouterAbi,
    functionName: "exactInputSingle",
    args: [
      {
        tokenIn: opts.quote.tokenIn,
        tokenOut: USDC,
        fee: opts.quote.fee,
        recipient,
        amountIn: opts.quote.amountIn,
        amountOutMinimum: opts.quote.minOut,
        sqrtPriceLimitX96: 0n,
      },
    ],
    value: tx.value,
  });
  if (result < opts.quote.minOut) {
    throw new Error("Swap simulation returned less than minOut.");
  }
  return { amountOut: result, tx };
}
