type Limit = { max: number; windowMs: number };

export class RateLimiter {
  private hits = new Map<string, number[]>();

  hit(
    key: string,
    limit: Limit,
  ): { ok: true; remaining: number } | { ok: false; retryAfterSec: number } {
    const now = Date.now();
    const cutoff = now - limit.windowMs;
    const prev = (this.hits.get(key) ?? []).filter((t) => t > cutoff);
    if (prev.length >= limit.max) {
      const retryAfterSec = Math.max(1, Math.ceil((prev[0]! + limit.windowMs - now) / 1000));
      return { ok: false, retryAfterSec };
    }
    prev.push(now);
    this.hits.set(key, prev);
    return { ok: true, remaining: limit.max - prev.length };
  }
}

const g = globalThis as unknown as { __longbidLimiter?: RateLimiter };

export function limiter(): RateLimiter {
  if (!g.__longbidLimiter) g.__longbidLimiter = new RateLimiter();
  return g.__longbidLimiter;
}

export function limitResponse(retryAfterSec: number) {
  return Response.json(
    { error: "Too many requests. Try again later." },
    { status: 429, headers: { "retry-after": String(retryAfterSec) } },
  );
}
