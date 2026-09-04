#!/usr/bin/env node
import { existsSync, rmSync } from "node:fs";
import {
  ARTIFACTS,
  LOG_PATH,
  STATE_PATH,
  STORE_SNAPSHOT,
  killTree,
  pidAlive,
  readState,
  restoreStore,
} from "./lib.mjs";

const state = readState();
if (state?.pid && pidAlive(state.pid)) {
  killTree(state.pid);
}

restoreStore();

if (existsSync(STATE_PATH)) rmSync(STATE_PATH);
if (existsSync(STORE_SNAPSHOT)) rmSync(STORE_SNAPSHOT);
if (existsSync(LOG_PATH)) rmSync(LOG_PATH);

console.log(
  JSON.stringify(
    {
      ok: true,
      killedPid: state?.pid ?? null,
      storeRestored: true,
      artifactsKept: ARTIFACTS,
    },
    null,
    2,
  ),
);
