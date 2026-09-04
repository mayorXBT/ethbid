#!/usr/bin/env node
import net from "node:net";
import {
  BASE_URL,
  LOG_PATH,
  PORT,
  fail,
  http,
  pidAlive,
  readState,
  seedEmptyStore,
  snapshotStore,
  spawnNext,
  writeState,
} from "./lib.mjs";

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: "127.0.0.1", port }, () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
  });
}

async function waitReady(timeoutMs = 90_000) {
  const start = Date.now();
  let last = "";
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await http("/", { timeoutMs: 3000 });
      last = `HTTP ${res.status}`;
      if (res.ok && res.text.includes("Rank is the bid.") && res.text.includes('aria-label="Place bid"')) {
        return res;
      }
      last = `${last}; missing identity markers`;
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timed out waiting for ${BASE_URL}. Last: ${last}`);
}

const existing = readState();
if (existing && pidAlive(existing.pid)) {
  fail(
    `A verify-longbid instance is already running (pid ${existing.pid} at ${existing.url}).`,
    "Refuse to double-drive. Run: node .cursor/skills/verify-longbid/scripts/cleanup.mjs",
  );
}

if (await portOpen(PORT)) {
  fail(
    `Port ${PORT} is already in use.`,
    "Do not drive a shared instance. Stop whatever owns 3456, or run cleanup.mjs if it is ours.",
  );
}

snapshotStore();
seedEmptyStore();

const child = spawnNext();
if (!child.pid) {
  fail("Failed to spawn next dev.");
}

writeState({
  pid: child.pid,
  port: PORT,
  url: BASE_URL,
  log: LOG_PATH,
  startedAt: new Date().toISOString(),
});

try {
  await waitReady();
} catch (error) {
  fail(error instanceof Error ? error.message : String(error), `Log: ${LOG_PATH}`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      pid: child.pid,
      url: BASE_URL,
      port: PORT,
      ready: ["Rank is the bid.", 'aria-label="Place bid"'],
      store: "file .data/store.json (seeded empty, remote backends blanked)",
    },
    null,
    2,
  ),
);
