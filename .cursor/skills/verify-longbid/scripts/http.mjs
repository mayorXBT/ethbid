#!/usr/bin/env node
import { fail, http, readState } from "./lib.mjs";

const method = (process.argv[2] || "GET").toUpperCase();
const pathname = process.argv[3];
const bodyArg = process.argv[4];

if (!pathname) {
  fail("Usage: node .cursor/skills/verify-longbid/scripts/http.mjs GET|POST <path> [json-body]");
}

const state = readState();
if (!state) {
  fail("No verify-longbid state. Launch first.");
}

const res = await http(pathname, {
  method,
  body: bodyArg,
  timeoutMs: 15000,
});

let json = null;
try {
  json = JSON.parse(res.text);
} catch {
  json = null;
}

console.log(
  JSON.stringify(
    {
      ok: res.ok,
      status: res.status,
      url: res.url,
      json,
      text: json ? undefined : res.text.slice(0, 4000),
    },
    null,
    2,
  ),
);

if (!res.ok) process.exit(1);
