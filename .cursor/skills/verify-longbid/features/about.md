# About

About explains why the board exists and how a listing is placed. It does not mutate the board.

## Sub-features

- `about-open` opens the page from each listed entry point.
- `about-copy` shows `Why this exists`, `How it works`, and `Counters`.
- `about-claim` returns to the board via `Claim a rank →`.

## How to get to it (user POV)

- Choose `About` in the desktop header.
- Choose `About` inside `Open menu` on a narrow viewport.
- Open `http://127.0.0.1:3456/about`.

## Driving it with verify-longbid

Preconditions:

- Isolated instance healthy at `http://127.0.0.1:3456`.
- Viewport `1280x720` for the header link.

- **Direct URL.** Open about. Run `$B goto http://127.0.0.1:3456/about`. The heading reads `About`. Eyebrow reads `Why this exists`.
- **Header entry.** From `/`, choose `About`. Run `$B goto http://127.0.0.1:3456` then `$B click` the link named `About`. URL is `/about`.
- **Claim link.** Choose `Claim a rank →`. Run `$B click` the link named `Claim a rank →`. URL is `/` and the claim form heading `Rank is the bid.` is visible.
- **Proof.** Capture about. Run `$B screenshot .cursor/skills/verify-longbid/artifacts/about/about.png` and save `$B snapshot -i` to `artifacts/about/about.aria.txt`. The screenshot shows `ETHBid` and `How it works`.

## Gotchas

- Same `md` breakpoint as Rules: header `About` is not visible on mobile. Use `Open menu` or the direct URL.
- Counters copy says visitors start at 0. The isolated seed starts visitors at 0; presence from the verify browser may increment Live after a few seconds. That is not a board mutation.
