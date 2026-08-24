export const MIN_NEW_BID_USD = 1;
export const MAX_BID_USD = 999_999;
export const TOP_SPOT_PREMIUM_USD = 1;

export function parseUsd(input: string | number): number | null {
  const n = typeof input === "number" ? input : Number(String(input).replace(/[$,\s]/g, ""));
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
  return n;
}

export function formatUsd(amount: number, opts?: { compact?: boolean }): string {
  if (opts?.compact && amount >= 10_000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatUsdc(amount: number): string {
  return `${formatUsd(amount)} USDC`;
}

export function clampBid(amount: number): number {
  return Math.min(MAX_BID_USD, Math.max(1, Math.floor(amount)));
}
