---
name: verify-longbid
description: Drive the Longbid web leaderboard (Next.js at 127.0.0.1:3456) like a user. Use after UI, ranking, bid-form, nav, or copy changes to prove board, place-bid, rules, about, and navigation.
---

# Verify Longbid

Longbid is a public pay-to-rank leaderboard. Users see a web UI. Rank is the bid.

Primary surface: the Next.js App Router site (`src/app`). Secondary: JSON APIs under `/api/*`. There is no CLI. Vitest covers library units only; it is not a user-path proof.

You are reading this cold. Launch an isolated instance, doctor it, drive the mapped feature, capture evidence, then clean up. Never drive the user's everyday `localhost:3000` / `3001` session.

## Launch

From the repo root:

```bash
node .cursor/skills/verify-longbid/scripts/launch.mjs
```

Ready when stdout is JSON with `"ok": true` and `url` is `http://127.0.0.1:3456`. The homepage HTML contains `Rank is the bid.` and `aria-label="Place bid"`.

What launch does:

- Binds **only** port `3456`. Refuses if that port is taken or a previous verify pid is still alive.
- Blanks `DATABASE_URL`, every `SUPABASE_*` / `NEXT_PUBLIC_SUPABASE_*` key, Crossmint keys, MoonPay keys, and `PAYMENT_PROVIDER` so this process cannot touch hosted Postgres or payment APIs. `.env.local` is ignored for those names because they are already set empty in the child env.
- Sets `NEXT_PUBLIC_BIDS_ENABLED=true` and `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3456`.
- Snapshots `.data/store.json` to `.tmp-verify/store.snapshot.json`, then seeds an empty file store. The app then uses `.data/store.json` (see `src/lib/store.ts`).
- Writes `.tmp-verify/state.json` (`pid`, `url`, `port`) and logs to `.tmp-verify/next.log`.

If launch fails, run cleanup immediately so the snapshot is restored and the pid is not left behind.

Two file-store Next processes would share `.data/store.json`. That is why a second verify instance is refused. Do not start `npm run dev` on 3000 in file-store mode while a verify instance is running.

## Doctor

```bash
node .cursor/skills/verify-longbid/scripts/doctor.mjs
node .cursor/skills/verify-longbid/scripts/doctor.mjs --baseline
```

Worth driving when doctor prints `"ok": true`. It checks: state url/port, pid alive, `GET /` 200 with Longbid identity and `aria-label="Place bid"`, `GET /api/listings` JSON shape, `GET /rules` and `GET /about` copy.

`--baseline` also requires the seeded empty board (`Board is empty. First $5 USDC listing takes #1.` and `listings.length === 0`). Run `--baseline` right after launch. Do not use it after a mutating recipe.

If anything looks off, doctor first. An instance that talks to hosted Supabase is not this verify instance: listings will not be empty after a fresh launch, and you must stop and relaunch rather than write to it.

## Drive

Browser harness: gstack browse (headless Chromium). HTTP helper for APIs.

Resolve browse, then always `goto` the verify URL before acting (the daemon tab persists across sessions):

```bash
B="$HOME/.codex/skills/gstack/browse/dist/browse"
[ -x "$B.exe" ] && B="$B.exe"
# Windows: %USERPROFILE%\.codex\skills\gstack\browse\dist\browse.exe
```

```bash
$B goto http://127.0.0.1:3456
$B snapshot -i
```

HTTP (same isolated origin):

```bash
node .cursor/skills/verify-longbid/scripts/http.mjs GET /api/listings
node .cursor/skills/verify-longbid/scripts/http.mjs POST /api/bids "{\"target\":\"https://example.xyz\",\"category\":\"defi\",\"amount\":5}"
```

Stable handles from this repo (prefer these over coordinates):

| Control | Handle |
|---|---|
| Wordmark home | link text `ETHBid` → `/` |
| Board | link name `Board` → `/` (desktop `nav`, `md+`) |
| Rules | link name `Rules` → `/rules` |
| About | link name `About` → `/about` |
| Theme | `aria-label` `Switch to light mode` / `Switch to dark mode` |
| Mobile menu | `aria-label` `Open menu` / `Close menu` (`md:hidden`) |
| Target field | `input[name="target"]` placeholder `product URL or @handle` |
| Category | `select[name="category"]` (required; first option `Category` is disabled) |
| Bid amount | `aria-label="Bid amount in USDC"` |
| Decrease / increase bid | `aria-label="Decrease bid"` / `Increase bid` |
| Submit | `aria-label="Place bid"` when bidding is open |
| Empty board | exact text `Board is empty. First $5 USDC listing takes #1.` |
| Checkout heading | `h1` `Checkout` on `/pay/<uuid>` |
| Paid flash | `/?paid=1` text `Bid confirmed. Rank is the onchain bid. You are on the board.` |

Category slugs that the form accepts: `l1s-l2s`, `defi`, `wallets`, `ai-crypto`, `infra`, `stablecoins`, `nfts-gaming`, `analytics`, `exchanges`, `social`.

Read `features/README.md` and the matching feature file before driving. A proof that hits one convenient URL is incomplete when that file lists other entry points.

Desktop nav is `hidden` below `md`. Use viewport `1280x720` for Board/Rules/About in the header, `375x812` for `Open menu`.

## Evidence

Put proof under `.cursor/skills/verify-longbid/artifacts/<feature>/`. Cleanup does not delete this directory.

Minimum for a pass:

- Exercise the real UI or the same fetch the UI uses (`POST /api/bids` from the claim form, not a test-only route). There is no test-only settle endpoint that is safe on a live payment stack; isolated launch blanks payment keys on purpose.
- Capture the action and the resulting state: before screenshot or ARIA snapshot, the action (`$B click` / fill / HTTP POST), after screenshot or snapshot, plus the JSON or file-store side effect.
- Side effects: `GET /api/listings` and, after creating a bid, `GET /api/bids/<id>` plus `.data/store.json` (`bids[]` grows; `listings[]` stays empty until a bid is marked paid). Isolated pay pages will not create Crossmint wallets; the checkout error `CROSSMINT_API_KEY is missing on the server` is the expected isolated end state, not a product bug.
- Screenshots must show the Longbid wordmark or the `Rank is the bid.` heading.
- Do not call MoonPay or Crossmint. Do not `POST /api/bids/<id>/complete` against a non-isolated instance. Do not use the user's `.env.local` keys.

Record the feature id and entry point on the artifacts (filename is enough: `artifacts/board/home.png`).

## Cleanup

```bash
node .cursor/skills/verify-longbid/scripts/cleanup.mjs
```

Kills the pid recorded in `.tmp-verify/state.json` (process tree, not a name match). Restores `.data/store.json` from the snapshot. Deletes `.tmp-verify/state.json`, the snapshot, and the next log. Leaves `.cursor/skills/verify-longbid/artifacts/` in place.

After cleanup, confirm the artifact files still exist. Then doctor should fail (no state). That is success.

## Helpers

All helpers are run from the repo root with Node 18+.

| Command | What it does |
|---|---|
| `node .cursor/skills/verify-longbid/scripts/launch.mjs` | Start isolated Next on 3456, seed empty file store |
| `node .cursor/skills/verify-longbid/scripts/doctor.mjs` | Read-only health of that instance |
| `node .cursor/skills/verify-longbid/scripts/doctor.mjs --baseline` | Health plus empty-board seed |
| `node .cursor/skills/verify-longbid/scripts/http.mjs GET\|POST <path> [json]` | Call the isolated origin |
| `node .cursor/skills/verify-longbid/scripts/cleanup.mjs` | Kill what launch started; restore store; keep artifacts |

Do not reverse-engineer flags. There are none except doctor's `--baseline`.
