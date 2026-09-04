#!/usr/bin/env node
import {
  BASE_URL,
  PORT,
  fail,
  http,
  pidAlive,
  readState,
} from "./lib.mjs";

const state = readState();
if (!state) {
  fail("No verify-longbid state. Launch first: node .cursor/skills/verify-longbid/scripts/launch.mjs");
}

const checks = [];
function check(name, ok, detail) {
  checks.push({ name, ok, detail });
  if (!ok) fail(`doctor failed: ${name}`, detail);
}

check("state-url", state.url === BASE_URL, `expected ${BASE_URL}, got ${state.url}`);
check("state-port", state.port === PORT, `expected ${PORT}, got ${state.port}`);
check("pid-alive", pidAlive(state.pid), `pid ${state.pid} is not running`);

const home = await http("/");
check("home-http", home.status === 200, `GET / → ${home.status}`);
check("home-identity", home.text.includes("ETHBid") && home.text.includes("Rank is the bid."), "homepage missing ETHBid identity");
check("home-bid-open", home.text.includes('aria-label="Place bid"'), "Place bid is not enabled; isolated launch must set NEXT_PUBLIC_BIDS_ENABLED=true");

const listings = await http("/api/listings");
let board;
try {
  board = JSON.parse(listings.text);
} catch {
  fail("GET /api/listings is not JSON", listings.text.slice(0, 400));
}
check("listings-http", listings.status === 200, `GET /api/listings → ${listings.status}`);
check("listings-shape", Array.isArray(board.listings) && Array.isArray(board.activity) && board.stats, "board JSON missing listings/activity/stats");

const baseline = process.argv.includes("--baseline");
if (baseline) {
  check("home-empty-board", home.text.includes("Board is empty. First canonical USDC bid this round takes #1."), "empty-board copy missing; instance may not be the seeded file store");
  check("listings-empty", board.listings.length === 0, `expected empty board, got ${board.listings.length} listings — do not drive a shared/prod store`);
}

const rules = await http("/rules");
check("rules-http", rules.status === 200 && rules.text.includes("Rules") && rules.text.includes("How ranking works"), "GET /rules missing protocol copy");

const about = await http("/about");
check("about-http", about.status === 200 && about.text.includes("About") && about.text.includes("Why this exists"), "GET /about missing about copy");

console.log(
  JSON.stringify(
    {
      ok: true,
      url: state.url,
      pid: state.pid,
      port: state.port,
      listings: board.listings.length,
      stats: board.stats,
      checks: checks.map((c) => c.name),
    },
    null,
    2,
  ),
);
