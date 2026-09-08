import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { isAddress } from "viem";

export const CHALLENGE_TTL_MS = 30 * 60_000;

export type DomainChallenge = {
  domain: string;
  wallet: string;
  nonce: string;
  expiresAt: number;
  consumed: boolean;
};

const DATA_PATH = path.join(process.cwd(), ".data", "ethbid-challenges.json");

function empty(): DomainChallenge[] {
  return [];
}

async function load(): Promise<DomainChallenge[]> {
  try {
    const raw = await readFile(DATA_PATH, "utf8");
    const parsed = JSON.parse(raw) as DomainChallenge[];
    return Array.isArray(parsed) ? parsed : empty();
  } catch {
    return empty();
  }
}

async function save(rows: DomainChallenge[]) {
  await mkdir(path.dirname(DATA_PATH), { recursive: true });
  await writeFile(DATA_PATH, JSON.stringify(rows, null, 2));
}

const HOST_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const IPV4_RE = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const BLOCKED_TLDS = new Set(["local", "localhost", "internal", "arpa", "invalid", "onion"]);

export function normalizeDomain(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed || trimmed.length > 253 || trimmed.includes(" ")) return null;
  let host = trimmed;
  if (trimmed.includes("://")) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
      host = parsed.hostname;
    } catch {
      return null;
    }
  } else if (trimmed.includes("/") || trimmed.includes("?") || trimmed.includes("#")) {
    return null;
  }
  host = host.replace(/^www\./, "").replace(/\.$/, "");
  if (IPV4_RE.test(host) || host.includes(":")) return null;
  if (!HOST_RE.test(host)) return null;
  const tld = host.slice(host.lastIndexOf(".") + 1);
  if (BLOCKED_TLDS.has(tld) || host === "localhost") return null;
  return host;
}

export function wellKnownBody(wallet: string, nonce: string): string {
  return JSON.stringify({ wallet: wallet.toLowerCase(), nonce }, null, 2);
}

export function matchWellKnown(json: unknown, wallet: string, nonce: string): boolean {
  if (!json || typeof json !== "object") return false;
  const rec = json as { wallet?: unknown; nonce?: unknown; ethbid?: unknown };
  const w = String(rec.wallet ?? rec.ethbid ?? "").toLowerCase();
  const n = String(rec.nonce ?? "");
  return w === wallet.toLowerCase() && n === nonce;
}

export function matchTxtRecords(records: string[][], wallet: string, nonce: string): boolean {
  const needleWallet = wallet.toLowerCase();
  const joined = records.map((row) => row.join(""));
  return joined.some((line) => {
    const lower = line.toLowerCase();
    return lower.includes(nonce.toLowerCase()) && lower.includes(needleWallet);
  });
}

export async function issueChallenge(domain: string, wallet: string): Promise<DomainChallenge> {
  const host = normalizeDomain(domain);
  if (!host) throw new Error("Need a real website domain.");
  if (!isAddress(wallet)) throw new Error("Connect a wallet first.");
  const rows = await load();
  const nonce = randomBytes(16).toString("hex");
  const challenge: DomainChallenge = {
    domain: host,
    wallet: wallet.toLowerCase(),
    nonce,
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
    consumed: false,
  };
  const next = rows.filter((row) => !(row.domain === host && row.wallet === challenge.wallet && !row.consumed));
  next.push(challenge);
  await save(next);
  return challenge;
}

export async function consumeIfValid(domain: string, wallet: string): Promise<DomainChallenge> {
  const host = normalizeDomain(domain);
  if (!host) throw new Error("Need a real website domain.");
  const key = wallet.toLowerCase();
  const rows = await load();
  const row = [...rows].reverse().find((item) => item.domain === host && item.wallet === key);
  if (!row) throw new Error("No domain challenge. Issue one first.");
  if (row.consumed) throw new Error("Domain challenge already used. Issue a new one.");
  if (Date.now() > row.expiresAt) throw new Error("Domain challenge expired. Issue a new one.");
  return row;
}

export async function markConsumed(nonce: string) {
  const rows = await load();
  const next = rows.map((row) => (row.nonce === nonce ? { ...row, consumed: true } : row));
  await save(next);
}
