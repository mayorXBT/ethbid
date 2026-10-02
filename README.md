# ETHBid

Onchain discovery market for crypto products. Verify ownership. Bid Paxos USDG on Arbitrum. Rank is public from the contracts.

Live: [https://ethbid.longbid.lol](https://ethbid.longbid.lol)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Copy `.env.example` to `.env.local`. Rank reads contract events (or `GRAPH_SUBGRAPH_URL` when set). Bids go onchain.

## Stack

- Next.js 15 (App Router) + TypeScript
- wagmi + viem
- Settlement on Arbitrum Sepolia (chain 421614), with Robinhood Chain testnet config ready
- Paxos USDG as the bid asset
- Foundry contracts in `contracts/`
- The Graph subgraph in `subgraph/` (optional; `/verify` falls back to `getLogs`)

Treasury and admin are set on `RankingRound`. Addresses in [contracts/deployments.md](./contracts/deployments.md).

## Why Arbitrum

A ranking market is a lot of small actions. Register, top up, outbid, withdraw. On Ethereum L1 the gas on a $5 bid can eat the bid. Arbitrum is EVM-equivalent, so the same Solidity stays, and those actions cost cents.

ETHBid uses that split on purpose.

- Identity stays on Ethereum mainnet. ENS ownership is still read from L1.
- Settlement lives on Arbitrum. `ProjectRegistry`, `RankingRound`, and `BidRouter` deploy there. The bid token is Paxos USDG (`0xFFC95faa3d63Cde504a05B567C600B78C0b41892` on Arbitrum Sepolia).
- Auction timing uses `block.timestamp`, not `block.number`. On Arbitrum `block.number` is the L1 block.

Direct `approve` + `RankingRound.placeBid` is the demo path. Testnet Uniswap pools for USDG have no useful liquidity, so the ETH swap router stays deployed and unused until a pool exists.

Faucets for the Sepolia demo: [arbitrum.faucet.dev](https://arbitrum.faucet.dev), [faucet.circle.com](https://faucet.circle.com), [faucet.paxos.com](https://faucet.paxos.com).

Measured receipts. Ethereum mainnet 2026-08-30 (effective 0.2 gwei that day). Arbitrum Sepolia 2026-10-02 (effective ~0.040 gwei).

| Action | Ethereum gas | ETH paid | Arb Sepolia gas | ETH paid |
|---|---|---|---|---|
| ProjectRegistry deploy | 658,662 | 0.000132 | 680,951 | 0.000027 |
| RankingRound deploy | 1,142,792 | 0.000229 | 1,185,628 | 0.000048 |
| BidRouter deploy | 900,661 | 0.000180 | 925,590 | 0.000037 |
| setRouter | 45,286 | 0.000009 | 46,913 | 0.000002 |
| startRound | 68,297 | 0.000014 | 69,918 | 0.000003 |
| **deploy total** | **2,815,698** | **0.000563** | **2,909,000** | **0.000117** |
| `register` (live) | — | — | 144,219 | 0.000006 |
| `approve` USDG (live) | — | — | 58,409 | 0.000002 |
| `placeBid` 5 USDG (live) | — | — | 146,296 | 0.000006 |
| `placeBid` 10 USDG outbid (live) | — | — | 129,213 | 0.000005 |

Same bytecode, about 4.8× cheaper in ETH at that unusually cheap L1 day. At a more typical 1 gwei L1 the gap is about 24×. A live Sepolia bid paid 0.000006 ETH (about $0.02 at $3,500/ETH). The same 146k gas on L1 at 1 gwei is about $0.51.

Sourcify `exact_match` on chain 421614 (Arbiscan API key was not set, so the Arbiscan UI may still catch up from Sourcify):

- [ProjectRegistry](https://repo.sourcify.dev/421614/0x5b185DC5443dca8bda7C4ca7De1a6BcA8d73C2b6/)
- [RankingRound](https://repo.sourcify.dev/421614/0x3cC438F47c330AB747cf5404c573156221beD2fD/)
- [BidRouter](https://repo.sourcify.dev/421614/0xd010E8bdbd492124aF10D2ac3f025beaC2E9D44C/)

Arbitrum Sepolia contracts (chain 421614). These CREATE addresses collide with the Ethereum mainnet sequence. Pair every address with the chain ID.

- ProjectRegistry [`0x5b185DC5443dca8bda7C4ca7De1a6BcA8d73C2b6`](https://sepolia.arbiscan.io/address/0x5b185DC5443dca8bda7C4ca7De1a6BcA8d73C2b6)
- RankingRound [`0x3cC438F47c330AB747cf5404c573156221beD2fD`](https://sepolia.arbiscan.io/address/0x3cC438F47c330AB747cf5404c573156221beD2fD)
- BidRouter [`0xd010E8bdbd492124aF10D2ac3f025beaC2E9D44C`](https://sepolia.arbiscan.io/address/0xd010E8bdbd492124aF10D2ac3f025beaC2E9D44C)

## What broke and how it was fixed

- `wagmi.ts` only knew `mainnet` and `sepolia`. Any other `NEXT_PUBLIC_ETHBID_CHAIN_ID` still attached Ethereum Sepolia. Settlement chains now live in `src/lib/ethbid/chains.ts`.
- `submit.ts` quoted Uniswap only on chain 1 and otherwise sent a blind 0.01 ETH swap. L2 bids now `approve` USDG and call `RankingRound.placeBid`.
- ENS reads used the connected wallet's chain. After the default moved to Arbitrum that would miss L1 names. `src/lib/ens/client.ts` pins Ethereum mainnet.
- `/verify` used `mainnet` vs `sepolia` and died without The Graph. It now uses the settlement RPC and falls back to `getLogs`.
- `next.config.ts` inlined Ethereum mainnet addresses, so Vercel could not switch chains from env alone. Defaults are Arbitrum Sepolia USDG/WETH, with registry/ranking/router filled after deploy.
- Isolated `/verify-longbid` would have hit live Arbitrum if contracts were configured. Launch now sets `ETHBID_FILE_STORE=1`.
- `RankingRound.setTreasury(address(0))` was allowed even though `ZeroTreasury` existed. It now reverts.
- `forge script` on Arbitrum Sepolia simulates, then fails to decode `RankingRound` constructor args (`IERC20` vs `address`). Broadcast used `forge create --broadcast` instead.
- Deployer had 0 Sepolia ETH. Alchemy/QuickNode faucets need 0.001 mainnet ETH. OpenFaucet.org PoW (`chainId=ARBITRUM_SEPOLIA`, official `PoWMiner.js`) funded 0.01 ETH in tx [`0xd7081c1c…`](https://sepolia.arbiscan.io/tx/0xd7081c1c49bb1d77a0e18223d4d2f27efe0a368df9bb69e2d9bdae34bafb9c7b).
- CREATE from the same deployer nonce reused Ethereum mainnet addresses. Rank and router on Sepolia equal registry and ranking on mainnet. Docs now always pair address with chain ID.
- `hash-wasm` Argon2d proofs were rejected by OpenFaucet. The official WASM miner is required.
- Paxos USDG faucet is `POST https://api.sandbox.paxos.com/v2/treasury/faucet/transfers` with `{token:"USDG",network:"ARBITRUM_ONE",address}`. `ARBITRUM_ONE` is the faucet name for Arbitrum Sepolia. 100 test USDG landed immediately.
- `finalize` while the 30-day round is live reverts `RoundNotEnded`. Settle waits until `1793524980` (about 2026-11-01). That window covers judging through 2026-10-12.
- The Graph subgraph still indexes Ethereum mainnet. With `GRAPH_SUBGRAPH_URL` set, the board returned an empty Sepolia leaderboard even after live bids. `getBoard` now uses settlement `getLogs` unless the chain is Ethereum.
- Activity rows used the L2 block number as a Unix timestamp (year 1979). They now read `block.timestamp` from `getBlock`.
- The Place bid button stayed on `Coming soon` after deploy. Turbopack only inlines `process.env.NEXT_PUBLIC_*` on static access. `ethbidContracts` used `process.env[name]`, so the client bundle had empty CAs. It now reads each var by name.

## Built during the Arbitrum Open House Singapore buildathon

Pre-buildathon tag: `pre-arbitrum-buildathon`. Commits after that tag are the migration: Arbitrum + Robinhood chain config, USDG settlement, direct bid path, event-log ranking fallback, network switch, and this section.

## Docs

- Existing Longbid, before this work. [BEFORE.md](./BEFORE.md)
- ETHBid architecture. [ETHBID.md](./ETHBID.md)
- Uniswap notes. [FEEDBACK.md](./FEEDBACK.md)
- Operator notes. [dev.md](./dev.md)
