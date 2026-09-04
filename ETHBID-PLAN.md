# ETHBid plan vs to-build.md

Source of truth is `C:\Users\hp\Downloads\to build.md`. This file is the checklist. Check a box only with evidence named on the same line. Do not mark Longbid checkout (Crossmint, MoonPay) as ETHBid work.

Execution order is section 17 of to-build.md. Do not polish UI until items 3, 4, and 5 are green.

## 17. MVP order

- [x] **1. Run and understand existing Longbid.** `BEFORE.md`. `npm test` 33/33. `next dev` on :3002, `GET /` `/rules` `/about` `/api/listings` 200.
- [x] **2. Protect continuity documentation.** `BEFORE.md`, `ETHBID.md`, `FEEDBACK.md`, README Before / During split. During section still lists unshipped work.
- [x] **3. Spike ENS verification.** `src/lib/ens/verify-ens.ts`. viem 2.36.0. Live Universal Resolver `ur.integration-tests.eth` → `0x2222…` and CCIP `test.offchaindemo.eth`. Wallet match is addr record or registry/NameWrapper owner. Not a full Sepolia register-and-write flow.
- [x] **4. Spike one Uniswap conversion.** Quote `src/lib/uniswap/quote-usdc.ts`. Swap `src/lib/uniswap/swap-usdc.ts` via SwapRouter02 `exactInputSingle`. Live mainnet `eth_call` 0.01 ETH → USDC >= minOut. `npx vitest run src/lib/uniswap` 5/5. Not broadcast. Trading API 401 without a dashboard key. `FEEDBACK.md` filled from that run.
- [x] **5. Spike one indexed contract event through The Graph.** Studio `ethbid` v0.0.1. `_meta.block` 25905703 vs head 25905705, `hasIndexingErrors: false`. Round 1 indexed (`0x…0001`, start 2026-08-30T14:28:23Z, end 2026-09-06T14:28:23Z, not finalized). Bids empty because no `BidPlaced` yet. `https://ethbid.longbid.lol/verify` shows the Studio URL and "Graph returned an empty bid list for this round."
- [x] **6. Implement `ProjectRegistry`.** `contracts/src/ProjectRegistry.sol`. Register, update, verify (ENS/domain identity lock), transfer. `forge test` includes 7 registry tests, all pass.
- [x] **7. Implement `RankingRound`.** `contracts/src/RankingRound.sol`. Time-boxed round, only project owner bids, increase, full withdraw before end, finalize after end. 6 tests pass.
- [x] **8. Implement `BidRouter`.** `contracts/src/BidRouter.sol`. ETH or ERC-20 in via SwapRouter02 `exactInputSingle`, minOut, deadline, leftover refund, `creditBid` into `RankingRound`. `forge test` 21/13+8. Not a mainnet broadcast.
- [x] **9. Full register-to-rank flow.** `contracts/test/RegisterToRank.t.sol`. register → verify ENS identityRef → `bidWithEth` → canonical USDC on the round. `forge test` 22/22. App path `src/lib/ethbid/submit.ts` (needs deployed addresses).
- [x] **10. Connect existing Longbid UI.** Injected wallet on the existing header/mobile nav. Same claim form. Onchain submit only when `NEXT_PUBLIC_ETHBID_*` is set. No new template. Addresses empty until deploy, so Longbid API path still runs.
- [x] **11. Verification and transaction states.** ENS + domain panel on the claim form. Domain challenge issue/check with expiry and consume (`/api/ethbid/challenge`). Bid steps: ENS check, register, verify, swap, confirmed. Retry on fail. `src/lib/ethbid/domain-challenge.test.ts` and `errors.test.ts`.
- [x] **12. Public ranking-verification page.** `/verify`. Formula, tie-break, contract env, active round (if deployed), subgraph URL, `CurrentLeaderboard` query, Graph result or the auth error. Nav link Verify.
- [x] **13. Tests.** `forge test` 25/25 (register, auth, transfer, bid, increase, withdraw, finalize, tie-break timestamps, events, reentrancy no double-pay, unsupported token, minOut/slippage, deadline, register-to-rank). `npx vitest run` 56/56 (ENS live, Uniswap quote+swap sim, domain matchers, rank tie-break, Graph queries, errors). `npx next build` pass, `/verify` in the route table. No Playwright wallet e2e. Graph live query still needs a key.
- [x] **14. Deploy `ethbid.longbid.lol`.** Vercel `configured_correctly` (CNAME `f4251f44e1e7e133.vercel-dns-017.com.`). Project framework was `Other` (static 404s); set to Next.js and redeployed `dpl_EBTHtMUsgeUCsht57cLPWX1XUoNv`. `https://ethbid.longbid.lol/` `/verify` `/rules` `/about` 200, `X-Powered-By: Next.js`. `/verify` HTML has formula plus registry `0x3cC438F4…`, ranking `0xd010E8bd…`, router `0xD5ed47C1…`. Graph still `not configured`. `https://longbid.lol/` still 200.
- [ ] **15. Demo under five minutes and submission docs.**

## 19. Definition of done

- [x] Runs at `ethbid.longbid.lol`
- [ ] Longbid UI preserved and extended, not replaced
- [ ] Connect wallet
- [ ] Verify existing ENS identity
- [ ] Domain verification fallback
- [ ] Verified wallet controls the listing
- [ ] Bid with a supported non-USDC token
- [ ] Uniswap converts to canonical USDC
- [ ] Contracts record canonical bid and round
- [x] The Graph indexes enough to reconstruct the board
- [x] UI reads indexed onchain data, not Supabase rank
- [ ] Third party can reproduce the ranking
- [ ] Unauthorized wallets cannot edit or withdraw
- [ ] Contract, frontend, and e2e tests pass
- [ ] Production build passes
- [ ] Continuity docs separate old vs new
- [ ] Demo under five minutes

## 18. Non-goals (do not build)

ETHBid token, fiat/MoonPay, referrals, voting, AI recs, click-to-earn, World ID, extra chains, social feed, extra governance, mandatory `ethbid.eth` subnames, Longbid redesign.

## Next

Paused until ETHOnline 2026 kickoff (Sept 4). Continuity track. Do not treat pre-kickoff ETHBid as the whole submission.

In-event leftover:

1. Homepage board reads the subgraph. Wired in `getBoard` via `src/lib/graph/board.ts`. Isolated verify blanks Graph env so the file store still seeds empty.
2. Item 15. Demo under five minutes + submission docs.
3. Public git history (no `*Copy*` junk, no single dump commit). Tag a pre-event boundary.
4. Marketing / SEO / metadata for ETHBid (titles, description, OG). Do not present old Longbid copy as hackathon work.
