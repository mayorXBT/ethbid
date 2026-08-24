import { serverEnv } from "./env";
import type { Bid } from "./types";

export function crossmintApiKey(): string {
  return serverEnv("CROSSMINT_API_KEY");
}

export function crossmintEnabled(): boolean {
  return Boolean(crossmintApiKey());
}

function apiHost(): string {
  const key = crossmintApiKey();
  if (key.includes("staging") || key.startsWith("sk_test") || key.startsWith("ck_")) {
    return "https://staging.crossmint.com";
  }
  return "https://www.crossmint.com";
}

async function cmFetch(path: string, init?: RequestInit) {
  const key = crossmintApiKey();
  if (!key) throw new Error("CROSSMINT_API_KEY is missing.");
  const res = await fetch(`${apiHost()}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 400) };
  }
  if (!res.ok) {
    const rec = json as { message?: string; error?: string; details?: string };
    throw new Error(rec?.message || rec?.error || rec?.details || `Crossmint ${res.status}`);
  }
  return json;
}

export interface DepositAddresses {
  evm: string | null;
  sol: string | null;
  error: string | null;
}

function addressOf(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const rec = data as { address?: string };
  return rec.address || null;
}

async function createWallet(opts: {
  chainType: "evm" | "solana";
  owner: string;
  alias: string;
  email: string;
}): Promise<{ address: string | null; error: string | null }> {
  const payloads: unknown[] = [
    {
      chainType: opts.chainType,
      owner: opts.owner,
      alias: opts.alias,
      config: { adminSigner: { type: "email", email: opts.email } },
    },
    {
      chainType: opts.chainType,
      type: "smart",
      owner: opts.owner,
      alias: opts.alias,
      config: { adminSigner: { type: "email", email: opts.email } },
    },
    {
      chainType: opts.chainType,
      type: "smart",
      owner: opts.owner,
      alias: opts.alias,
      config: { adminSigner: { type: "api-key" } },
    },
    {
      chainType: opts.chainType,
      type: "mpc",
      owner: opts.owner,
      alias: opts.alias,
    },
  ];

  const errors: string[] = [];
  for (const body of payloads) {
    try {
      const data = await cmFetch("/api/2025-06-09/wallets", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const address = addressOf(data);
      if (address) return { address, error: null };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Wallet create failed.");
    }
  }

  try {
    const existing = await cmFetch(
      `/api/2025-06-09/wallets/${encodeURIComponent(`${opts.owner}:${opts.chainType}`)}`,
    );
    const address = addressOf(existing);
    if (address) return { address, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message && !/not found/i.test(message)) errors.push(message);
  }

  return { address: null, error: errors[0] ?? "Wallet create failed." };
}

export async function ensureDepositAddresses(bid: Bid): Promise<DepositAddresses> {
  if (bid.depositEvm && bid.depositSol) {
    return { evm: bid.depositEvm, sol: bid.depositSol, error: null };
  }
  if (!crossmintEnabled()) {
    return {
      evm: null,
      sol: null,
      error: "CROSSMINT_API_KEY is missing on the server. Put the secret key in .env.local, not NEXT_PUBLIC_.",
    };
  }

  const slug = bid.id.replace(/-/g, "").slice(0, 16).toLowerCase();
  const owner = `userId:longbid-${slug}`;
  const alias = `bid-${slug}`;
  const email = serverEnv("CROSSMINT_SIGNER_EMAIL") || `bid-${slug}@longbid.lol`;
  const [evmRes, solRes] = await Promise.all([
    bid.depositEvm
      ? Promise.resolve({ address: bid.depositEvm, error: null as string | null })
      : createWallet({ chainType: "evm", owner, alias, email }),
    bid.depositSol
      ? Promise.resolve({ address: bid.depositSol, error: null as string | null })
      : createWallet({ chainType: "solana", owner, alias, email }),
  ]);

  const evm = evmRes.address;
  const sol = solRes.address;
  if (!evm && !sol) {
    const detail = evmRes.error || solRes.error || "unknown error";
    return {
      evm: null,
      sol: null,
      error: `Could not open a USDC deposit wallet (${detail}). In the Crossmint console, enable wallets.create, wallets.read, and wallets:balance.read on this server API key. No collection or NFT is required.`,
    };
  }
  return { evm, sol, error: null };
}

function parseUsdc(raw: unknown): number {
  const items = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { tokens?: unknown[] }).tokens)
      ? (raw as { tokens: unknown[] }).tokens
      : raw
        ? [raw]
        : [];

  let total = 0;
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const symbol = String(rec.symbol ?? "").toUpperCase();
    if (symbol && symbol !== "USDC" && symbol !== "USDXM") continue;
    const amount = Number(rec.amount ?? rec.balanceUSD ?? 0);
    if (Number.isFinite(amount) && amount > 0) {
      total += amount;
      continue;
    }
    const decimals = Number(rec.decimals ?? 6);
    const rawAmount = Number(rec.rawAmount ?? rec.balance ?? 0);
    if (Number.isFinite(rawAmount) && rawAmount > 0) {
      total += rawAmount > 1000 ? rawAmount / 10 ** decimals : rawAmount;
    }
  }
  return total;
}

export async function receivedUsdc(addresses: DepositAddresses): Promise<number> {
  if (!crossmintApiKey()) return 0;
  const totals: number[] = [];
  const lookups: Array<{ locator: string; chains: string }> = [];
  if (addresses.evm) lookups.push({ locator: addresses.evm, chains: "base" });
  if (addresses.sol) lookups.push({ locator: addresses.sol, chains: "solana" });

  for (const { locator, chains } of lookups) {
    try {
      const data = await cmFetch(
        `/api/2025-06-09/wallets/${encodeURIComponent(locator)}/balances?tokens=usdc&chains=${chains}`,
      );
      totals.push(parseUsdc(data));
    } catch {
      // ignore missing wallet
    }
  }
  return totals.reduce((a, b) => a + b, 0);
}

export function paymentCovered(received: number, due: number): boolean {
  return received + 0.000001 >= due;
}

export function treasuryAddresses() {
  return {
    evm: serverEnv("CROSSMINT_TREASURY_EVM"),
    sol: serverEnv("CROSSMINT_TREASURY_SOL"),
    email: serverEnv("CROSSMINT_SIGNER_EMAIL"),
  };
}

function transferSigner(): string | null {
  const email = serverEnv("CROSSMINT_SIGNER_EMAIL");
  if (email) return `email:${email}`;
  return "api-key";
}

async function transferUsdc(opts: {
  from: string;
  to: string;
  amount: number;
  token: string;
}): Promise<{ ok: boolean; error?: string }> {
  const signer = transferSigner();
  const body: Record<string, unknown> = {
    amount: String(opts.amount),
    recipient: opts.to,
  };
  if (signer) body.signer = signer;
  try {
    await cmFetch(
      `/api/2025-06-09/wallets/${encodeURIComponent(opts.from)}/tokens/${encodeURIComponent(opts.token)}/transfers`,
      { method: "POST", body: JSON.stringify(body) },
    );
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "sweep failed" };
  }
}

/** Best-effort. Rank already wrote. Failure must not unwind the bid. */
export async function sweepToTreasury(
  deposits: DepositAddresses,
  amountUsd: number,
): Promise<{ attempted: boolean; errors: string[] }> {
  const treasury = treasuryAddresses();
  const errors: string[] = [];
  if (!treasury.evm && !treasury.sol) return { attempted: false, errors };

  if (deposits.evm && treasury.evm) {
    const evm = await transferUsdc({
      from: deposits.evm,
      to: treasury.evm,
      amount: amountUsd,
      token: "base:usdc",
    });
    if (!evm.ok && evm.error) errors.push(`base: ${evm.error}`);
  }
  if (deposits.sol && treasury.sol) {
    const sol = await transferUsdc({
      from: deposits.sol,
      to: treasury.sol,
      amount: amountUsd,
      token: "solana:usdc",
    });
    if (!sol.ok && sol.error) errors.push(`solana: ${sol.error}`);
  }
  return { attempted: true, errors };
}

export async function verifyCrossmintSignature(
  payload: string,
  signature: string | null,
): Promise<boolean> {
  const secret = serverEnv("CROSSMINT_WEBHOOK_SECRET");
  if (!secret) return false;
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const digest = Buffer.from(mac).toString("hex");
  return digest === signature.replace(/^sha256=/, "");
}

export function recipientFromWebhook(event: {
  type?: string;
  data?: { recipient?: { address?: string } };
}): string | null {
  if (event.type !== "wallets.transfer.in") return null;
  return event.data?.recipient?.address ?? null;
}
