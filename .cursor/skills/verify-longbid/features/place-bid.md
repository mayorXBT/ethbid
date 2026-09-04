# Place a bid

Place a bid lets a user put a URL or @handle and a whole-USDC amount on the book. Checkout opens at `/pay/<bid-id>`. Rank does not change until payment confirms.

## Sub-features

- `bid-open` shows an enabled `Place bid` submit on the isolated instance.
- `bid-amount` steps the amount with `Decrease bid` / `Increase bid` and the `Bid amount in USDC` field. Floor is `$5`.
- `bid-submit` posts the form and navigates to `/pay/<uuid>`.
- `bid-checkout-isolated` shows Checkout with a missing-Crossmint deposit error because payment keys are blanked.
- `bid-coming-soon` is the production default when `NEXT_PUBLIC_BIDS_ENABLED` is not `true`. Do not expect it on the isolated launch.

## How to get to it (user POV)

- Fill the form on `/` (target, category, bid) and choose `Place bid`.
- Open `/pay/<bid-id>` after a successful submit.
- Choose an existing row's bid amount to land on `/?amount=<n>` (amount prefill only).

## Driving it with verify-longbid

Preconditions:

- Isolated instance healthy at `http://127.0.0.1:3456`.
- Baseline empty board.
- Bidding open: homepage contains `aria-label="Place bid"`.
- Do not restore payment API keys for this recipe.

- **Confirm submit is enabled.** Open `/`. Run `$B goto http://127.0.0.1:3456` and `$B snapshot -i`. A button named `Place bid` is enabled. There is no enabled control named `Coming soon`.
- **Enter target.** Type a URL. Run `$B fill 'input[name="target"]' "https://example.xyz"`. The textbox holds `https://example.xyz`.
- **Pick category.** Choose DeFi. Run `$B select 'select[name="category"]' "defi"`. The select value is `defi`.
- **Set amount.** Leave the default (at least `5`) or fill `5`. Run `$B fill '[aria-label="Bid amount in USDC"]' "5"` if it is not already `5`.
- **Submit via UI.** Choose `Place bid`. Run `$B click '[aria-label="Place bid"]'`. The URL becomes `/pay/<uuid>` and the heading reads `Checkout`.
- **Submit via HTTP (same path the form uses).** Create a second bid. Run `node .cursor/skills/verify-longbid/scripts/http.mjs POST /api/bids "{\"target\":\"https://example.xyz\",\"category\":\"defi\",\"amount\":5}"`. Status `200`, `json.bid.id` is a UUID, `json.bid.status` is `pending`, `json.quote.kind` is `new`.
- **Isolated checkout.** Open that pay URL. Run `$B goto http://127.0.0.1:3456/pay/<id-from-json>`. Heading `Checkout`. Body includes `CROSSMINT_API_KEY is missing on the server` or `MoonPay checkout is not available` is absent because `PAYMENT_PROVIDER` is blank. Cancel link `← Cancel, keep my money` returns to `/`.
- **Proof.** Capture form before submit and checkout after. Run `$B screenshot .cursor/skills/verify-longbid/artifacts/place-bid/form.png` before submit and `$B screenshot .cursor/skills/verify-longbid/artifacts/place-bid/checkout.png` on `/pay/<id>`. Save the POST JSON as `artifacts/place-bid/bid.json`. Re-read `GET /api/listings` — `listings` is still `[]` because the bid is pending.

## Gotchas

- Isolated launch blanks Crossmint and MoonPay. Checkout without deposit addresses is the proof that we did not call production wallets. Do not "fix" it by exporting `.env.local` into the verify process.
- `POST /api/bids/<id>/complete` is a Crossmint poll trigger, not a fake settle. On an isolated instance it cannot mark paid. Do not use it as a shortcut to populate the board.
- Rate limit is 5 bids / 15 minutes / IP. A hung loop of POST /api/bids will 429.
- Invalid target copy is `Need a real URL or @handle.` Category must be a known slug.
- `Coming soon` is still in the DOM as visually hidden text when bidding is open. Assert `aria-label="Place bid"`, not absence of the string `Coming soon`.
- Amount prefill reads `?amount=` on the home form. `?claim=` is not applied by the form.
