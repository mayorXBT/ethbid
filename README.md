# ETHBid

Onchain discovery market for crypto products. Verify ownership. Bid through Uniswap into canonical USDC. Rank is public on The Graph.

Live: [https://ethbid.longbid.lol](https://ethbid.longbid.lol)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Copy `.env.example` to `.env.local`. Rank reads `GRAPH_SUBGRAPH_URL`. Bids go onchain, not through a checkout page.

## Stack

- Next.js 15 (App Router) + TypeScript
- wagmi + viem
- Uniswap V3 SwapRouter02 on Ethereum mainnet
- The Graph subgraph in `subgraph/`
- Foundry contracts in `contracts/`

Treasury and admin are set on `RankingRound`: `0x0F7F971D864360bE5DaA0C23D16A8E25eBe23179`. Addresses in [contracts/deployments.md](./contracts/deployments.md).

## Docs

- Existing Longbid, before this work. [BEFORE.md](./BEFORE.md)
- ETHBid architecture. [ETHBID.md](./ETHBID.md)
- Uniswap notes. [FEEDBACK.md](./FEEDBACK.md)
- Operator notes. [dev.md](./dev.md)
