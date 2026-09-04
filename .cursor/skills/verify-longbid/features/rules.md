# Rules

Rules is the protocol page: how ranking, money, counters, and listings work. It does not mutate the board.

## Sub-features

- `rules-open` opens the page from each listed entry point.
- `rules-copy` shows ranking, money, counters, and listings sections.
- `rules-back` returns to the board.

## How to get to it (user POV)

- Choose `Rules` in the desktop header.
- Choose `Rules` inside `Open menu` on a narrow viewport.
- Open `http://127.0.0.1:3456/rules`.

## Driving it with verify-longbid

Preconditions:

- Isolated instance healthy at `http://127.0.0.1:3456`.
- Viewport `1280x720` for the header link.

- **Direct URL.** Open rules. Run `$B goto http://127.0.0.1:3456/rules`. The heading reads `Rules`. Eyebrow reads `Protocol`. A section titled `How ranking works` is visible.
- **Header entry.** From `/`, choose `Rules`. Run `$B goto http://127.0.0.1:3456` then `$B click` the link named `Rules`. URL is `/rules`.
- **Back to board.** Choose `← Back to the board`. Run `$B click` the link named `← Back to the board`. URL is `/` and `Rank is the bid.` is visible.
- **Proof.** Capture the protocol page. Run `$B screenshot .cursor/skills/verify-longbid/artifacts/rules/rules.png` and `$B snapshot -i -o` is not required; write `$B snapshot -i` stdout to `artifacts/rules/rules.aria.txt`. The screenshot shows `ETHBid` and `How ranking works`.

## Gotchas

- Desktop `Rules` is inside a `nav` that is `hidden` below `md`. A 375px viewport will not show the header link; use `Open menu` or the direct URL, and report which entry you used.
- This page is static copy. A 200 with the heading is not enough; the ranking section must be in the screenshot.
