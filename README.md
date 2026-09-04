# Longbid

Public pay-to-rank leaderboard for crypto products. Rank is the bid.

```bash
npm install
npx supabase start
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The board starts empty. First $5 USDC listing takes #1.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind v4, shadcn/ui (New York), JetBrains Sans + JetBrains Mono
- Supabase/Postgres (`npx supabase start` for local)
- Crossmint USDC deposit wallets on Base + Solana (API key only, no NFT collection)

Copy `.env.example` to `.env.local`. Put the Crossmint server key in `CROSSMINT_API_KEY` (never `NEXT_PUBLIC_`). Enable scopes `wallets.create`, `wallets.read`, and `wallets:balance.read`. Point a `wallets.transfer.in` webhook at `/api/webhooks/crossmint` when you have a public URL.

## Deploy (Vercel)

1. Push `main` to GitHub.
2. Import the repo in [Vercel](https://vercel.com/new). Framework: Next.js.
3. Paste env vars from `.env.example` (values from `.env.local`). Set `NEXT_PUBLIC_SITE_URL` to the live host.
4. Deploy production. Attach `longbid.lol` under Domains.
5. Run `supabase/migrations/0001_init.sql` in the Supabase SQL editor if tables are not created yet.
6. Crossmint webhook: `https://longbid.lol/api/webhooks/crossmint` (event `wallets.transfer.in`).

## ETHOnline 2026

ETHBid is the onchain edition of this product. Target URL is `https://ethbid.longbid.lol`.

- Existing Longbid. [BEFORE.md](./BEFORE.md)
- ETHBid architecture. [ETHBID.md](./ETHBID.md)
- Uniswap notes. [FEEDBACK.md](./FEEDBACK.md)

### Before ETHOnline

Longbid.lol is a hosted pay-to-rank board. Founders send USDC through Crossmint deposit wallets or MoonPay. Rank is a server sort over Supabase. There is no wallet connect, no ENS verification, and no public way to reconstruct the board from chain events.

### Built during ETHOnline

Contracts are on Ethereum mainnet. Addresses in [contracts/deployments.md](./contracts/deployments.md). Wallet connect, ENS/domain checks, Uniswap conversion into canonical USDC, and a public Verify page are in this repo. The Graph still needs a deployed subgraph. The live host `ethbid.longbid.lol` is not attached yet. See [ETHBID.md](./ETHBID.md).
