import { spawn, execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "../../../..");
export const VERIFY_DIR = path.join(ROOT, ".tmp-verify");
export const STATE_PATH = path.join(VERIFY_DIR, "state.json");
export const LOG_PATH = path.join(VERIFY_DIR, "next.log");
export const STORE_PATH = path.join(ROOT, ".data", "store.json");
export const STORE_SNAPSHOT = path.join(VERIFY_DIR, "store.snapshot.json");
export const PORT = 3456;
export const BASE_URL = `http://127.0.0.1:${PORT}`;
export const ARTIFACTS = path.join(ROOT, ".cursor", "skills", "verify-longbid", "artifacts");

export const EMPTY_STORE = {
  listings: [],
  activity: [],
  visitors: 0,
  presence: {},
};

export function isolatedEnv() {
  return {
    ...process.env,
    PORT: String(PORT),
    NEXT_PUBLIC_SITE_URL: BASE_URL,
    DATABASE_URL: "",
    DATABASE_FORCE_DIRECT: "",
    SUPABASE_URL: "",
    NEXT_PUBLIC_SUPABASE_URL: "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
    SUPABASE_SERVICE_ROLE_KEY: "",
    VERCEL: "",
    GRAPH_SUBGRAPH_URL: "",
    GRAPH_API_KEY: "",
  };
}

export function readState() {
  if (!existsSync(STATE_PATH)) return null;
  try {
    return JSON.parse(readFileSync(STATE_PATH, "utf8"));
  } catch {
    return null;
  }
}

export function writeState(state) {
  mkdirSync(VERIFY_DIR, { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

export function pidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function killTree(pid) {
  if (!pidAlive(pid)) return;
  if (process.platform === "win32") {
    try {
      execFileSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" });
    } catch {
      /* already gone */
    }
    return;
  }
  try {
    process.kill(-pid, "SIGTERM");
  } catch {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      /* already gone */
    }
  }
}

export async function http(pathname, { method = "GET", body, timeoutMs = 8000 } = {}) {
  const url = pathname.startsWith("http") ? pathname : `${BASE_URL}${pathname}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
      signal: ctrl.signal,
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text, url };
  } finally {
    clearTimeout(timer);
  }
}

export function snapshotStore() {
  mkdirSync(VERIFY_DIR, { recursive: true });
  mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  if (existsSync(STORE_PATH)) {
    writeFileSync(STORE_SNAPSHOT, readFileSync(STORE_PATH));
  } else if (existsSync(STORE_SNAPSHOT)) {
    rmSync(STORE_SNAPSHOT);
  }
}

export function seedEmptyStore() {
  mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify(EMPTY_STORE, null, 2));
}

export function restoreStore() {
  if (existsSync(STORE_SNAPSHOT)) {
    mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    writeFileSync(STORE_PATH, readFileSync(STORE_SNAPSHOT));
    return;
  }
}

export function spawnNext() {
  mkdirSync(VERIFY_DIR, { recursive: true });
  writeFileSync(LOG_PATH, "");
  const nextBin = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
  if (!existsSync(nextBin)) {
    throw new Error(`Missing ${nextBin}. Run npm install in the repo root.`);
  }
  const args = [nextBin, "dev", "--turbopack", "-p", String(PORT)];
  // Windows Node EINVAL on detached + inherited fds. stdio ignore is required.
  const child = spawn(process.execPath, args, {
    cwd: ROOT,
    env: isolatedEnv(),
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();
  return child;
}

export function fail(message, extra) {
  const payload = extra ? `${message}\n${extra}` : message;
  console.error(payload);
  process.exit(1);
}
