# Board

The board is the public book: an empty state when nobody has paid, then ranked listings with bid size, category, and a click-through to the product.

## Sub-features

- `board-empty` shows the empty-book copy on a seeded instance.
- `board-hero` shows `Rank is the bid.` and the live/visitors/clicks counters.
- `board-listed` shows ranked rows after a paid listing exists (not reachable on the isolated seed without settling a real payment).
- `board-outbid-link` on a listed row points at `/?claim=<id>&amount=<claimPriceUsd>` and prefills the bid amount.

## How to get to it (user POV)

- Open `http://127.0.0.1:3456/`.
- Choose the `ETHBid` wordmark.
- Choose `Board` in the header (desktop) or in `Open menu` (mobile).

## Driving it with verify-longbid

Preconditions:

- Isolated instance healthy at `http://127.0.0.1:3456`.
- `doctor.mjs --baseline` reports an empty board.
- Viewport `1280x720` unless proving mobile.

- **Open home.** Go to the board. Run `$B goto http://127.0.0.1:3456`. The heading reads `Rank is the bid.` and the empty copy reads `Board is empty. First canonical USDC bid this round takes #1.`
- **Confirm API.** Read the book over HTTP. Run `node .cursor/skills/verify-longbid/scripts/http.mjs GET /api/listings`. Status `200`, `listings` is `[]`, `stats.listings` is `0`.
- **Wordmark entry.** Choose `ETHBid`. Run `$B snapshot -i` then `$B click` the link whose name is `ETHBid`. URL stays `/` and the same empty copy is visible.
- **Header Board.** Choose `Board`. Run `$B click` the link named `Board`. URL is `http://127.0.0.1:3456/` (or `/` with no extra query).
- **Proof.** Capture empty board plus identity. Run `$B snapshot -i -a -o .cursor/skills/verify-longbid/artifacts/board/home.aria.png` and `$B screenshot .cursor/skills/verify-longbid/artifacts/board/home.png`. Both show `ETHBid` and `Board is empty. First canonical USDC bid this round takes #1.` Save the HTTP JSON next to them as `artifacts/board/listings.json`.

## Gotchas

- A populated board after a fresh launch means this process is not using the seeded file store. Stop. Do not POST bids.
- `board-listed` and `board-outbid-link` need a paid listing. Isolated launch cannot settle USDC. Report those sub-features unreachable unless a recipe has already paid into this file store.
- Header counters (`Live`, `Visitors`, `Clicks`) update via `/api/presence`. Your own tab counts. Do not treat a non-zero Live count as pollution of the seed.
- The logo image `alt` is empty. Identity is the `ETHBid` text, not the img alt.
