# Longbid before ETHOnline

This is a record of Longbid as it existed before ETHBid work. It is reference, not a plan. Paths are from this repo on branch `feat/moonpay-dynamic-payments`. Live site is `https://longbid.lol`.

`npm test` on this tree. 11 files, 33 tests, all pass.

## What a user sees

Longbid is a public pay-to-rank board for crypto products. Rank is the bid. There is no wallet connect, no ENS check, and no onchain ranking contract.

The homepage (`src/app/page.tsx`) is a sticky header, a claim form, ranked product cards, and a "Latest fills" list. Default theme is dark. Light theme stores `lb_theme` in localStorage.

Header (`src/components/header.tsx`) shows Longbid.lol, live browsers in the last 60 seconds, unique visitors ever, and outbound clicks. Desktop nav is Board, Rules, About. Below the `md` breakpoint the same links live in `Open menu` (`src/components/mobile-nav.tsx`).

The claim form (`src/components/claim-form.tsx`) takes a product URL or `@handle`, a category, and a whole-USDC amount. Floor is $5. Ceiling is $999,999. Submit posts `/api/bids` and goes to `/pay/<id>`. When `NEXT_PUBLIC_BIDS_ENABLED` is not `true`, the button reads Coming soon and the API returns 503.

Empty board copy is "Board is empty. First $5 USDC listing takes #1." Cards (`src/components/board-table.tsx`) are an ordered list, not a table. Top three ranks use bid green, cyan, and bronze. "see details" hits `/go/<id>`, which counts a click and 302s to the listing URL.

Checkout (`src/components/checkout.tsx`) is either Crossmint deposit addresses (Base USDC and Solana USDC) or a MoonPay hosted charge. Rank writes only after payment confirms. `?paid=1` shows "Payment cleared. Rank is the bid. You are on the board."

Rules and About are static copy. 404 copy is "Page not on the book."

Identity. Dark background `#07080a`, bid green `#3dff9a`, JetBrains Mono for sans and mono (`src/app/globals.css`, `src/app/layout.tsx`). Tagline is "Rank is the bid."

## Stack

- Next.js 15.5.9 App Router, React 19, TypeScript, npm (`package-lock.json`)
- Tailwind v4, shadcn New York tokens, custom CVA controls in `src/components/ui/`
- Vitest for library tests (`npm test`)
- Vercel deploy as documented in `README.md`. Domain `longbid.lol`.

There is no wagmi, no viem in `package.json`, no Foundry, no subgraph.

## Routes

Pages. `/`, `/rules`, `/about`, `/pay/[id]`, `/og` (noindex card), `not-found`.

APIs.

- `POST /api/bids` creates a pending bid
- `GET /api/bids/[id]` polls settlement
- `POST /api/bids/[id]/complete` asks Crossmint to check the deposit again
- `GET /api/listings` returns the board JSON
- `POST /api/presence` heartbeats cookie `lb_vid`
- `POST /api/webhooks/crossmint` and `POST /api/webhooks/moonpay` settle paid bids
- `GET /go/[id]` counts a click and redirects

## Ranking (offchain)

`src/lib/ranking.ts` and `src/lib/money.ts`.

```
score = listing.bidUsd
```

Tie-break is older `createdAt` first. Taking #1 costs at least $1 more than the current top bid, and never less than $5. A smaller bid still lands at whatever rank that size can take. A raise pays only the difference.

This formula is a server function over the listings table. It is not reconstructed from chain events.

## Payments

Provider is `PAYMENT_PROVIDER`. Default is Crossmint. `moonpay` uses Helio charges (`src/lib/moonpay.ts`).

Crossmint (`src/lib/crossmint.ts`) creates custodial deposit wallets per bid on Base and Solana. Rank writes when the wallet USDC balance covers `amountDueUsd`. A later sweep tries to send USDC to `CROSSMINT_TREASURY_EVM` and `CROSSMINT_TREASURY_SOL`. Sweep failure does not unwind rank.

MoonPay settlement is webhook-only. Polling does not mark a MoonPay bid paid.

There is no token selector and no Uniswap swap. The founder must send USDC, or pay through MoonPay.

## Data

`src/lib/store.ts` tries Postgres (`DATABASE_URL`), then Supabase JS, then `.data/store.json` when not on Vercel.

Tables in `supabase/migrations/0001_init.sql` and `0002_moonpay.sql`. `listings`, `bids`, `activity`, `visitors`. RLS is on. Public can SELECT listings and activity. Bids and visitors have no public policies. Writes use the service role or `DATABASE_URL`.

Listing fields. id, canonicalKey, url, handle, name, description, favicon, og image, category, bidUsd, clickCount, timestamps. No verified owner wallet. No ENS name. No round id.

Visitor identity is cookie `lb_vid`, httpOnly, not a wallet.

## Auth

None as a product feature. No SIWE. No session user. Anyone who pays can list the canonical URL. There is no "only the verified wallet can edit."

## Tests that existed

`src/lib/*.test.ts` only. Ranking, quotes, URL canonical keys, bid body schema, rate limit, env, supabase key shape, Crossmint HMAC and signer, MoonPay charge shape, settle retry. No component tests. No wallet tests. No e2e of connect → verify → bid.

## What this is not

Longbid is not independently verifiable from chain. The board is whatever the Next server and Supabase hold. That is the gap ETHBid is supposed to close.
