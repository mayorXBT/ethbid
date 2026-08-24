import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { verifyCrossmintSignature } from "./crossmint";

const original = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in original)) delete process.env[key];
  }
  Object.assign(process.env, original);
});

describe("verifyCrossmintSignature", () => {
  it("rejects unsigned payloads when the webhook secret is missing", async () => {
    delete process.env.CROSSMINT_WEBHOOK_SECRET;
    expect(await verifyCrossmintSignature("{}", "abc")).toBe(false);
  });

  it("accepts the HMAC for the configured secret", async () => {
    const payload = '{"type":"wallets.transfer.in"}';
    const secret = "test-webhook-secret";
    process.env.CROSSMINT_WEBHOOK_SECRET = secret;
    const digest = createHmac("sha256", secret).update(payload).digest("hex");

    expect(await verifyCrossmintSignature(payload, `sha256=${digest}`)).toBe(true);
    expect(await verifyCrossmintSignature(payload, "sha256=wrong")).toBe(false);
  });
});
