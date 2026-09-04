# Longbid verification map

This directory is the maintained source for verifying the user-facing behavior of Longbid. Read the index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- Launch with `node .cursor/skills/verify-longbid/scripts/launch.mjs`.
- The app is at `http://127.0.0.1:3456` only. Never drive `localhost:3000` or a hosted URL from this skill.
- File store is seeded empty. Remote Postgres, Supabase, Crossmint, and MoonPay env vars are blank in the launched process.
- `node .cursor/skills/verify-longbid/scripts/doctor.mjs --baseline` reports `ok: true`.
- gstack browse is on PATH as resolved in the skill (`browse.exe` on Windows).
- Never drive an instance that was not started by launch.mjs.

## Driving conventions

- Start every recipe from the baseline state unless its preconditions say otherwise.
- Prefer ARIA names, `name=` fields, and route paths over CSS position.
- Treat every command as literal. Keep quoted names and flags unchanged.
- Run browser actions through gstack browse (`$B`).
- Run API actions through `scripts/http.mjs` against the isolated origin.
- Restore the seeded empty store via cleanup.mjs. Do not remove proof artifacts.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes an ARIA snapshot (`$B snapshot -i`) and a screenshot with Longbid identity visible.
- HTTP proof includes the command, status, and JSON body.
- Mutation proof includes a second read (`GET /api/listings` or reopen `/`) of the stored value.
- Record the feature ID and entry point used with every artifact.
- Report an unreachable path with the attempted command and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with verify-longbid` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

Keep implementation details out of the map. Name only user paths, stable handles, required state, commands, and observable proof.

## Features

- [Board](./board.md) covers the empty book, counters, and listed rows.
- [Place a bid](./place-bid.md) covers the claim form, checkout, and isolated payment-missing state.
- [Rules](./rules.md) covers the protocol page.
- [About](./about.md) covers the why-this-exists page.
- [Navigation](./navigation.md) covers header links, mobile menu, theme, and 404.
