# Navigation

Navigation moves between Board, Rules, and About, toggles theme, and recovers from unknown routes.

## Sub-features

- `nav-desktop` shows `Board`, `Rules`, `About` at `md` and above.
- `nav-mobile` opens a drawer with those links below `md`.
- `nav-theme` switches `data-theme` between `dark` and `light` and persists `lb_theme` in localStorage.
- `nav-404` shows `Page not on the book.` and `Back to ETHBid`.

## How to get to it (user POV)

- Use the header links on a wide window.
- Choose `Open menu` on a narrow window.
- Choose the sun/moon button (`Switch to light mode` / `Switch to dark mode`).
- Open an unknown path such as `/no-such-page`.

## Driving it with verify-longbid

Preconditions:

- Isolated instance healthy at `http://127.0.0.1:3456`.

- **Desktop links.** Set a wide viewport. Run `$B viewport 1280x720` then `$B goto http://127.0.0.1:3456` and `$B snapshot -i`. Links named `Board`, `Rules`, and `About` are visible. Theme button `aria-label` is `Switch to light mode` on the default dark page.
- **Mobile drawer.** Set a narrow viewport. Run `$B viewport 375x812` then `$B goto http://127.0.0.1:3456`. A button named `Open menu` is visible. Run `$B click '[aria-label="Open menu"]'`. A `Close menu` button and links `Board`, `Rules`, `About` appear. Run `$B click` the link named `Rules`. URL is `/rules` and the drawer is closed.
- **Theme.** On desktop home, choose `Switch to light mode`. Run `$B click '[aria-label="Switch to light mode"]'`. `document.documentElement.dataset.theme` is `light` (`$B js "document.documentElement.dataset.theme"`). Reload. Run `$B goto http://127.0.0.1:3456` then `$B js "document.documentElement.dataset.theme"`. Value is still `light`. Switch back with `Switch to dark mode` before other recipes.
- **404.** Open a missing route. Run `$B goto http://127.0.0.1:3456/no-such-page`. Heading reads `Page not on the book.` Choose `Back to ETHBid`. Run `$B click` the link named `Back to ETHBid`. URL is `/`.
- **Proof.** Capture desktop header, open mobile drawer, and 404. Run `$B viewport 1280x720`, screenshot `artifacts/navigation/desktop.png`; `$B viewport 375x812` with menu open, screenshot `artifacts/navigation/mobile-menu.png`; 404 screenshot `artifacts/navigation/not-found.png`. Each shows Longbid identity or the 404 heading.

## Gotchas

- Snapshot refs die on navigation. Re-run `$B snapshot -i` after every `goto` and after opening the menu.
- Theme default is dark (`data-theme="dark"` on `<html>`). Leave the instance dark when you finish this recipe so later screenshots match.
- `Open menu` is `md:hidden`. A 1280 viewport will not show it.
- 404 is an app route (`src/app/not-found.tsx`), not the Next error overlay. A compile error is a failed launch, not this sub-feature.
