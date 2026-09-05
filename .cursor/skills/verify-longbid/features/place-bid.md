# Place a bid

Place a bid lets a founder connect a wallet, verify ENS or a domain, and send an onchain bid through Uniswap into canonical USDC. There is no `/pay` checkout and no Crossmint or MoonPay path.

## Sub-features

- `bid-open` shows an enabled `Place bid` submit when ETHBid contracts are configured.
- `bid-amount` steps the amount with `Decrease bid` / `Increase bid` and the `Bid amount in USDC` field. Floor is `$5`.
- `bid-wallet-gate` submitting without a connected wallet shows `Connect a wallet first.`
- Isolated launch cannot broadcast a mainnet swap. Do not expect a confirmed hash on 3456.

## How to get to it (user POV)

- Fill the form on `/` (target, category, bid, ENS or domain) and choose `Place bid`.

## Driving it with verify-longbid

Preconditions:

- Isolated instance healthy at `http://127.0.0.1:3456`.
- Baseline empty board.
- Homepage contains `aria-label="Place bid"`.

- **Confirm submit is enabled.** Open `/`. A button named `Place bid` is enabled.
- **Enter target.** Fill `input[name="target"]` with `https://example.xyz`.
- **Pick category.** Select `defi`.
- **Set amount.** Fill `Bid amount in USDC` with `5` if it is not already `5`.
- **Submit without a wallet.** Choose `Place bid`. The page stays on `/`. Copy includes `Connect a wallet first.`
- **Proof.** Screenshot the form. `GET /api/listings` stays `listings: []` because no onchain bid was sent.

## Gotchas

- Isolated launch blanks Graph. The board is the file-store empty state, not production rank.
- Do not POST `/api/bids`. That route is gone.
- `Coming soon` may still exist in the DOM as hidden text when bidding is open. Assert `aria-label="Place bid"`.
