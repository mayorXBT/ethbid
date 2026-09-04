# ETHBid

ETHBid is the onchain edition of Longbid. Live URL target is `https://ethbid.longbid.lol`. Event is ETHOnline 2026.

This file is the target architecture. It is not a claim that the work has shipped. Features that already existed in Longbid stay in `BEFORE.md`. Do not list them here as hackathon work.

## Promise

A founder can prove they control a product, bid with a supported token, and get a rank that anyone can reconstruct from contracts and The Graph.

Primary flow.

Connect wallet → submit product → verify ownership → choose token → bid → rank → independently verify

## What stays from Longbid

Reuse the existing UI. Header, board cards, claim form, checkout layout, Rules, About, colors, type, mobile menu. Extend those screens. Do not replace them with a new template.

Keep git history. Keep `https://longbid.lol` as the original product.

ETHBid does not use Crossmint deposit wallets or MoonPay. Those are Longbid checkout. ETHBid bidding is Uniswap into canonical USDC, then `RankingRound`. Fiat checkout is a non-goal.

## What is new

- Wallet connection (wagmi + viem) on the existing header
- ENS verification of an existing name the founder already owns
- Domain verification as a fallback (DNS TXT or `/.well-known/ethbid.json`)
- Verified badge and identity on product cards
- `ProjectRegistry`, `RankingRound`, `BidRouter` contracts
- Uniswap conversion of ETH or ERC-20 into canonical USDC
- Time-boxed rounds
- The Graph as the leaderboard source of truth
- A public Verify ranking page

Supabase stays optional cache, moderation, analytics, and challenge state. It is not authoritative for bid totals or rank.

## Contracts

Keep them small.

**ProjectRegistry.** Product id, verified owner, verification type and identity ref, authorized updates, ownership transfer. Events. `ProjectRegistered`, `ProjectUpdated`, `ProjectVerified`, `ProjectOwnerTransferred`. No large copy or images onchain.

**RankingRound.** Time-boxed rounds. Canonical USDC totals. Increases and documented withdrawals. Finalize. Events. `RoundStarted`, `BidPlaced`, `BidIncreased`, `BidWithdrawn`, `RoundFinalized`.

**BidRouter.** Selected token in. Qualifying Uniswap route. Slippage and deadline. Canonical USDC into `RankingRound`. Unused tokens back. Events include input token, input amount, and final USDC.

No ETHBid token. No mandatory `ethbid.eth` subnames.

## Ranking

MVP score is the active canonical USDC bid in the current round. Tie-break.

1. Higher active USDC bid
2. Earlier transaction in the round
3. Stable project id

That formula must be public on the Verify ranking page and reproducible from indexed events.

## Ownership

Never trust a client-supplied address.

ENS path. Resolve the name. Match owner, manager, or authorized wallet to the connected wallet. Store that wallet as listing owner.

Domain path. Server-issued nonce, expiry, consumed after success. DNS TXT or `/.well-known/ethbid.json`.

Only the verified wallet can edit, bid, increase, or withdraw for that listing.

## Data boundaries

| System | Authority |
|---|---|
| Contracts | owner, registration, bids, rounds, withdrawals |
| ENS | name ownership and resolver records |
| The Graph | indexed history and the UI leaderboard |
| Supabase | cache, challenges, analytics only |
| IPFS or object storage | logos, screenshots, long copy |

## Build order

1. This continuity pair (`BEFORE.md`, this file) and a README split
2. Isolated spikes. ENS verify, one Uniswap conversion, one Graph-indexed event
3. Contracts with Foundry tests
4. Register-to-rank path
5. Wire the existing Longbid UI
6. Verify ranking page
7. Deploy `ethbid.longbid.lol`

Do not polish the interface until the three spikes pass.

## Spike log

- ENS read path. `src/lib/ens/verify-ens.ts`. viem 2.36.0. Live: `ur.integration-tests.eth` → `0x2222…`, CCIP `test.offchaindemo.eth`. Wallet must match the addr record or the registry/NameWrapper owner.
- Uniswap conversion. Quote in `src/lib/uniswap/quote-usdc.ts` (V3 Quoter `0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6`). Swap in `src/lib/uniswap/swap-usdc.ts` (SwapRouter02 `0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45` `exactInputSingle`). Live `eth_call`: 0.01 ETH → canonical USDC, amountOut >= minOut. Not broadcast. Trading API still 401 without a dashboard key. See `FEEDBACK.md`.
- The Graph. Studio `ethbid` v0.0.1 indexes ProjectRegistry and RankingRound from the 2026-08-30 deploy. Live `_meta` at head, `hasIndexingErrors: false`. Round 1 present. Bids empty until a `BidPlaced`. `getBoard` reads the subgraph when `GRAPH_SUBGRAPH_URL` is set. `/verify` matches. Isolated verify blanks Graph so the file store can still seed empty.
- `ProjectRegistry`, `RankingRound`, `BidRouter` in `contracts/`. `forge test` 22/22 including register → verify → ETH bid → USDC on the round.
- UI. Injected Connect on the existing header. Claim form uses Uniswap+registry when `NEXT_PUBLIC_ETHBID_*` is set. Empty until deploy.
- Treasury. `RankingRound` constructor takes treasury. Admin can `setTreasury` later. `sweepToTreasury` only after finalize.
- Deploy script. `contracts/script/Deploy.s.sol`. Ethereum mainnet 2026-08-30. Registry `0x3cC438F4…`, RankingRound `0xd010E8bd…`, BidRouter `0xD5ed47C1…`. Admin/treasury `0x0F7F971D…`. Round 1 open. Site `https://ethbid.longbid.lol` 200 (Next.js). See `contracts/deployments.md`.
- Tests. `forge test` 25/25. `npx vitest run` 56/56. `npx next build` succeeds (`/verify` listed).

## Official sources (read 2026-08-29)

ENSv2 lives on Sepolia as a public beta. Mainnet names at `app.ens.domains` are still ENSv1. Resolve through the Universal Resolver. App libraries. viem `>= 2.35.0`. Docs. [ENSv2 overview](https://docs.ens.domains/ensv2/overview/), [deployments](https://docs.ens.domains/ens-deployments), [app readiness](https://docs.ens.domains/web/ensv2-readiness/). Test apps. `app.ens.dev`, `explorer.ens.dev`.

Uniswap ETHOnline 2026 prize page. [Uniswap Foundation](https://ethglobal.com/events/ethonline2026/prizes/uniswap-foundation). Qualifying work is a real integration of the Uniswap stack (API, AMM v2/v3/v4, CCA, or v4 hooks), a public repo, this `FEEDBACK.md`, and the Uniswap Developer Feedback Form. README must point at the contracts and lines. Do not treat a swap link as enough.

## Demo (under five minutes)

Show longbid.lol as the old product. Open ethbid.longbid.lol. Connect the wallet that controls an existing ENS name. Verify. Bid a non-USDC token. Show Uniswap converting to USDC. Show the ranking contract. Show the Graph query matching the board. Show that another wallet cannot edit or withdraw.
