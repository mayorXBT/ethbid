# ETHBid operator notes

Reference for this checkout. Not a tutorial. Do not put private keys in this file.

## Current work (2026-09-04)

Graph index is live. Studio subgraph `ethbid` v0.0.1. `_meta` is 2 blocks behind head, no indexing errors. Round 1 is in the store. No bids yet, so the leaderboard query is an empty list. That is a successful query, not a missing endpoint.

`GRAPH_SUBGRAPH_URL`, `GRAPH_API_KEY`, and `DEPLOY_KEY` are in `.env.local` (gitignored). Do not commit them. Do not print them.

Live `/verify` shows the Studio URL and "Graph returned an empty bid list for this round." Next: homepage board reads this subgraph instead of Supabase rank.

Do not treat Crossmint or MoonPay as ETHBid work. Those are Longbid checkout.

## Chain

Ethereum mainnet. Chain id `1`. Deployed 2026-08-30.

Admin and treasury are the same wallet: `0x0F7F971D864360bE5DaA0C23D16A8E25eBe23179`.

## Contract addresses

| Name | Address | Start block |
|---|---|---|
| ProjectRegistry | [`0x3cC438F47c330AB747cf5404c573156221beD2fD`](https://etherscan.io/address/0x3cC438F47c330AB747cf5404c573156221beD2fD) | 25868679 |
| RankingRound | [`0xd010E8bdbd492124aF10D2ac3f025beaC2E9D44C`](https://etherscan.io/address/0xd010E8bdbd492124aF10D2ac3f025beaC2E9D44C) | 25868680 |
| BidRouter | [`0xD5ed47C1b75D41DFE2de73620C1f496d89861D1D`](https://etherscan.io/address/0xD5ed47C1b75D41DFE2de73620C1f496d89861D1D) | 25868682 |

Round 1 is open, 7 days from `startRound`, not finalized at deploy.

## Deploy transactions

| Step | Tx | Block |
|---|---|---|
| ProjectRegistry | [`0x17aedf630e3a0a92216d737af43de29d705c7aa53a3e534f62f204aebfe1b5e3`](https://etherscan.io/tx/0x17aedf630e3a0a92216d737af43de29d705c7aa53a3e534f62f204aebfe1b5e3) | 25868679 |
| RankingRound | [`0x6dc32c63596452643e9ea1e5e543c82c9296e1069665c0770f3a564204c48198`](https://etherscan.io/tx/0x6dc32c63596452643e9ea1e5e543c82c9296e1069665c0770f3a564204c48198) | 25868680 |
| BidRouter | [`0x908b753f4e7e6ef9ba6443d58f297a99d5392ee02acadfaca2138052e842dc1a`](https://etherscan.io/tx/0x908b753f4e7e6ef9ba6443d58f297a99d5392ee02acadfaca2138052e842dc1a) | 25868682 |
| setRouter | [`0x20460381e38373bb9385f5e1282df3db930c9fbabd0c4aeed7e0f15df971c9b0`](https://etherscan.io/tx/0x20460381e38373bb9385f5e1282df3db930c9fbabd0c4aeed7e0f15df971c9b0) | 25868684 |
| startRound | [`0xcad48466a34f72ed5e57b4c4f78890d4d2076be5632fcf046725994a2f4a9db8`](https://etherscan.io/tx/0xcad48466a34f72ed5e57b4c4f78890d4d2076be5632fcf046725994a2f4a9db8) | 25868685 |

Pinned also in `contracts/deployments.md`.

## Uniswap and tokens (mainnet)

| Name | Address |
|---|---|
| SwapRouter02 | `0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45` |
| USDC (canonical bid unit) | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |
| WETH | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` |
| Uniswap V3 Quoter | `0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6` |

Bid path: founder token or ETH in through SwapRouter02 `exactInputSingle`, canonical USDC out, `RankingRound.creditBid`. Trading API stays unused until a Uniswap dashboard key exists.

## Frontend env

Already in `.env.example` and `.env.local` for the contracts:

```
NEXT_PUBLIC_ETHBID_CHAIN_ID=1
NEXT_PUBLIC_ETHBID_REGISTRY=0x3cC438F47c330AB747cf5404c573156221beD2fD
NEXT_PUBLIC_ETHBID_RANKING=0xd010E8bdbd492124aF10D2ac3f025beaC2E9D44C
NEXT_PUBLIC_ETHBID_ROUTER=0xD5ed47C1b75D41DFE2de73620C1f496d89861D1D
NEXT_PUBLIC_ETHBID_USDC=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
NEXT_PUBLIC_ETHBID_WETH=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
```

Set in `.env.local` and on Vercel `ethbid`. Never `NEXT_PUBLIC_` for Graph keys. Values stay gitignored. Do not paste keys into this file.

Public query URL:

```
https://api.studio.thegraph.com/query/1758672/ethbid/v0.0.1
```

## Ranking

```
score = active canonical USDC bid
```

Tie-break: higher USDC, then earlier bid in the round, then stable project id.

The Graph is authoritative for the ETHBid board. Supabase is Longbid cache only.

`/verify` reads `currentRoundId` from RankingRound, then runs `CurrentLeaderboard` against the subgraph.

Round id in GraphQL is a 32-byte padded hex, not a decimal. Round 1 is `0x` plus 63 zeros then `1`.

## Graph deploy (done)

Studio slug `ethbid`, version `v0.0.1`. Build `QmUvwBkSmdksX1s2Fi5ALci5LdJkhLyh62JkTmiA3qESwi`.

Checked 2026-09-04: `_meta.block` 25905703 vs chain head 25905705. `hasIndexingErrors: false`. Round 1 present. Bid list empty. Live `/verify` prints the query URL and "Graph returned an empty bid list for this round."

## Secrets. Do not print or commit

- `contracts/.env` `PRIVATE_KEY`
- `.env.local` Longbid secrets (Supabase service role, Crossmint, MoonPay)
- Graph deploy key and `GRAPH_API_KEY`

Gitignored. Admin and treasury are public onchain. The deployer key is not.

## Repo state

Branch: `feat/moonpay-dynamic-payments`. ETHBid files are mostly uncommitted on a dirty tree. `*Copy*` junk is leftover from a folder copy. Do not commit the copy files. Do not squash ETHBid into one dump commit.

Origin: `https://github.com/mayorXBT/LongBid.git`.

Site: `https://ethbid.longbid.lol` (Vercel project `ethbid`, CNAME `f4251f44e1e7e133.vercel-dns-017.com.`). `https://longbid.lol` stays the original product.

## Graph files

| Path | Role |
|---|---|
| `subgraph/schema.graphql` | Project, Round, Bid, BidEvent |
| `subgraph/queries.graphql` | Seven public queries |
| `subgraph/subgraph.yaml` | Mainnet dataSources and start blocks |
| `subgraph/src/` | Event mappings |
| `src/lib/graph/client.ts` | Server fetch to the gateway |
| `src/lib/graph/queries.ts` | Same seven queries for the app |
| `src/app/verify/page.tsx` | Public reconstruction page |

## Leftover after Graph is live

1. Homepage board reads the subgraph instead of Supabase rank.
2. Item 15. Demo under five minutes and submission docs.
3. Public git history. Tag `pre-ethonline-2026`.
4. ETHBid title, description, Open Graph. Do not reuse Longbid copy as hackathon work.
