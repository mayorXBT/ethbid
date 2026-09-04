# Uniswap integration feedback

Written during the first Uniswap spike (2026-08-29). Prize page read: [ETHOnline 2026 Uniswap Foundation](https://ethglobal.com/events/ethonline2026/prizes/uniswap-foundation).

## Status

Conversion spike is quote plus swap simulation.

- Quote. `src/lib/uniswap/quote-usdc.ts`. Uniswap V3 Quoter `0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6`.
- Swap. `src/lib/uniswap/swap-usdc.ts`. SwapRouter02 `0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45` `exactInputSingle`. ETH value in, canonical USDC out.

Live tests (mainnet `eth_call`, not a broadcast): 0.01 ETH through the quoted fee tier returns more than 1 USDC and at least `minOut`. This is AMM v3, which the prize list names.

No Uniswap API key in this repo. No funded ETHBid hot wallet, so nothing was sent onchain. BidRouter will wrap this calldata later.

## Integration experience

The ETHOnline prize accepts the Uniswap API, AMM v2/v3/v4, CCA, or v4 hooks. The Trading API is the path the current swap docs push (`/quote` then `/swap` or `/order`, Permit2). That needs `x-api-key` from [developers.uniswap.org/dashboard](https://developers.uniswap.org/dashboard).

Without a key, `POST https://trade-api.gateway.uniswap.org/v1/quote` returned HTTP 401 `Unauthorized` / `Unauthenticated api key or session` (requestId `d829dfc1d387ecff57f5531922c8a017`). No playground key in the public getting-started page we hit. So the first conversion spike uses the on-chain V3 Quoter, not the API.

QuoterV2 at the address commonly copied from older snippets (`0x61FFe014…f16e`) returned no bytecode on `ethereum-rpc.publicnode.com`. The original V3 Quoter at `0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6` simulated `quoteExactInputSingle` and returned a USDC amount.

Checksums matter. viem rejected a mistyped QuoterV2 checksum before any RPC call.

## Documentation

Two sites cover the same product. [developers.uniswap.org/docs/trading](https://developers.uniswap.org/docs/trading/swapping-api/getting-started) is the swap flow. [docs.uniswap.org/api/trading](https://docs.uniswap.org/api/trading/overview) still shows a cURL quote. Prize resources on ETHGlobal point at developers.uniswap.org.

The getting-started page is a three-step Permit2 story (`/check_approval`, `/quote`, `/swap` or `/order`). It does not show a no-key local quoter path. For a hackathon repo that cannot mint a dashboard key in the first hour, the AMM quoter is the only way to prove a conversion without waiting.

## Problems encountered

- Trading API is unusable until someone creates a dashboard key. 401 is immediate.
- QuoterV2 address from memory had no code on the public RPC we used.
- `simulateContract` errors were swallowed until we printed `shortMessage`. Empty revert data looks like a missing pool.

## Developer tooling

viem `simulateContract` against the V3 Quoter and SwapRouter02 is enough to prove amount-out on current mainnet state. SwapRouter02 accepts WETH as `tokenIn` with `msg.value` equal to `amountIn` (no separate wrap tx). No Foundry on this Windows PATH, so there is no Anvil fork that writes a USDC balance. A broadcast still needs a funded wallet. The API path still needs a dashboard key.

Uniswap AI skills (`npx skills add uniswap/uniswap-ai`) were not installed. The prize page lists them as a resource.

## Suggested improvements

Ship a documented no-auth quote example that hits Quoter or QuoterV2 on a public RPC, next to the API key flow. Say which Quoter address still has code on mainnet. Put a hackathon playground key in the getting-started cURL, or say there is none.

## Sources used

- 2026-08-29. [ETHOnline 2026 Uniswap Foundation prizes](https://ethglobal.com/events/ethonline2026/prizes/uniswap-foundation). Public repo, this file, and https://developers.uniswap.org/hackathon-feedback.
- 2026-08-29. [Swapping via the Uniswap API](https://developers.uniswap.org/docs/trading/swapping-api/getting-started)
- 2026-08-29. [Trading API overview](https://docs.uniswap.org/api/trading/overview)
- 2026-08-29. Live `quoteExactInputSingle` on mainnet Quoter V3.
