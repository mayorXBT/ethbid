# ETHBid

Onchain discovery market for crypto products. Prove you own a site. Bid Paxos USDG. Rank is the live bid, readable from the contracts. Bid more, rank higher, get more exposure.

**Demo (Arbitrum Open House):** [https://arb.longbid.lol](https://arb.longbid.lol)

Arbitrum Sepolia, test USDG. Connect a wallet, paste a product URL, bid. Rank 1 is the highest live bid.

Ethereum mainnet edition: [https://ethbid.longbid.lol](https://ethbid.longbid.lol)

## What ranking gets you

The homepage is the discovery surface. Visitors land on a public ranked board.

- **Exposure.** Higher bid means a higher row. #1 is the first product on the page. Top three get a larger card, bigger type, and a louder bid amount.
- **Clicks.** Each row is your favicon, product name, category, and live USDG bid. `see details` sends people to your real URL. The row also shows click count.
- **Distribution.** Listings sit in a category (L1s and L2s, exchanges, DeFi, wallets, and the rest). New bids land in Latest bids, so a rank change is visible without a press blast.
- **Proof.** Rank is the onchain bid. Anyone can rebuild the same order from contract events. The score is public USDG.
- **Control.** Only the registered owner can raise or withdraw. An outbid refunds the previous bidder. Withdraw clears the row.

If you want #1, you pay for it in USDG. If someone wants it more, they pay more.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `.env.example` already points at the Sepolia contracts. Leave `GRAPH_SUBGRAPH_URL` empty so the board reads contract logs.

```bash
npm test
npm run test:contracts
```

Contract tests need [Foundry](https://book.getfoundry.sh/getting-started/installation).

## How a listing works

1. Connect on Arbitrum Sepolia.
2. Register the product URL. That wallet becomes the onchain owner.
3. Approve USDG and `placeBid`. An outbid refunds the previous bidder.
4. `withdraw` clears the bid and drops the row from the board.

Only the registered owner can bid or withdraw for that project. Score is the active USDG amount. Ties break on earlier bid, then project id.

Test ETH: [arbitrum.faucet.dev](https://arbitrum.faucet.dev). Test USDG: [faucet.paxos.com](https://faucet.paxos.com) (network name `ARBITRUM_ONE` is Sepolia). The header has a Get test USDG link.

## Stack

- Next.js 15 (App Router) + TypeScript
- wagmi + viem
- Foundry contracts in `contracts/`
- Settlement on Arbitrum Sepolia (chain 421614). Robinhood Chain testnet config is in the code, not deployed.
- Bid asset is Paxos USDG (6 decimals)
- Optional Graph subgraph in `subgraph/` for Ethereum mainnet. Sepolia uses `getLogs`.
- Optional Supabase cache. Rank never lives there.

## Contracts

Arbitrum Sepolia, chain **421614**. CREATE from this deployer reused Ethereum mainnet addresses. Pair every address with the chain ID.

| Contract | Address |
|---|---|
| ProjectRegistry | [`0x5b185DC5443dca8bda7C4ca7De1a6BcA8d73C2b6`](https://sepolia.arbiscan.io/address/0x5b185DC5443dca8bda7C4ca7De1a6BcA8d73C2b6) |
| RankingRound | [`0x3cC438F47c330AB747cf5404c573156221beD2fD`](https://sepolia.arbiscan.io/address/0x3cC438F47c330AB747cf5404c573156221beD2fD) |
| BidRouter | [`0xd010E8bdbd492124aF10D2ac3f025beaC2E9D44C`](https://sepolia.arbiscan.io/address/0xd010E8bdbd492124aF10D2ac3f025beaC2E9D44C) |
| USDG | [`0xFFC95faa3d63Cde504a05B567C600B78C0b41892`](https://sepolia.arbiscan.io/address/0xFFC95faa3d63Cde504a05B567C600B78C0b41892) |

Sourcify `exact_match`: [registry](https://repo.sourcify.dev/421614/0x5b185DC5443dca8bda7C4ca7De1a6BcA8d73C2b6/), [ranking](https://repo.sourcify.dev/421614/0x3cC438F47c330AB747cf5404c573156221beD2fD/), [router](https://repo.sourcify.dev/421614/0xd010E8bdbd492124aF10D2ac3f025beaC2E9D44C/).

Admin and treasury sit on `RankingRound`. Full history, Ethereum mainnet addresses, and round window: [contracts/deployments.md](./contracts/deployments.md).

## Why Arbitrum

A ranking market is many small actions: register, top up, outbid, withdraw. On L1 the gas on a $5 bid can eat the bid. Same Solidity on Arbitrum costs cents.

- ENS ownership still reads Ethereum mainnet.
- Settlement (`ProjectRegistry`, `RankingRound`, `BidRouter`, USDG) lives on Arbitrum.
- Auction timing uses `block.timestamp`. On Arbitrum `block.number` is the L1 block.

The demo path is `approve` + `RankingRound.placeBid`. Testnet Uniswap pools for USDG have no useful liquidity, so the ETH swap router is deployed and idle until a pool exists.

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

Same bytecode, about 4.8× cheaper in ETH on that cheap L1 day. At a more typical 1 gwei L1 the gap is about 24×. A live Sepolia bid paid 0.000006 ETH (about $0.02 at $3,500/ETH). The same 146k gas on L1 at 1 gwei is about $0.51.

Built for the Arbitrum Open House Singapore Online Buildathon. Pre-migration tag: `pre-arbitrum-buildathon`.
