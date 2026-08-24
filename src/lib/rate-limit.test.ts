import { describe, expect, it } from "vitest";
import { RateLimiter } from "./rate-limit";

describe("RateLimiter", () => {
  it("allows up to max hits then denies", () => {
    const limiter = new RateLimiter();
    const key = "ip:1.2.3.4:bids";
    for (let i = 0; i < 5; i++) {
      expect(limiter.hit(key, { max: 5, windowMs: 60_000 }).ok).toBe(true);
    }
    const denied = limiter.hit(key, { max: 5, windowMs: 60_000 });
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.retryAfterSec).toBeGreaterThan(0);
  });

  it("isolates keys", () => {
    const limiter = new RateLimiter();
    expect(limiter.hit("a", { max: 1, windowMs: 60_000 }).ok).toBe(true);
    expect(limiter.hit("b", { max: 1, windowMs: 60_000 }).ok).toBe(true);
    expect(limiter.hit("a", { max: 1, windowMs: 60_000 }).ok).toBe(false);
  });
});
