import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { asJsonObject, isOutboundListingId, publicHttpUrl, stringField } from "./request";

describe("request guards", () => {
  it("accepts a plain object and rejects arrays", () => {
    expect(asJsonObject({ domain: "x.com" })).toEqual({ domain: "x.com" });
    expect(asJsonObject(["x.com"])).toBeNull();
    expect(asJsonObject("x.com")).toBeNull();
  });

  it("caps string fields", () => {
    expect(stringField({ domain: "  x.com  " }, "domain")).toBe("x.com");
    expect(stringField({ domain: "a".repeat(300) }, "domain", 8)).toBe("");
    expect(stringField({ domain: 1 }, "domain")).toBe("");
  });

  it("only redirects http(s) without credentials", () => {
    expect(publicHttpUrl("https://example.xyz/app")).toBe("https://example.xyz/app");
    expect(publicHttpUrl("javascript:alert(1)")).toBeNull();
    expect(publicHttpUrl("https://user:pass@example.xyz")).toBeNull();
  });

  it("accepts UUID and 32-byte project ids for outbound clicks", () => {
    expect(isOutboundListingId("3b12f1c8-8c2a-4d1e-9b3f-2a7c8d9e0f11")).toBe(true);
    expect(isOutboundListingId("0x" + "ab".repeat(32))).toBe(true);
    expect(isOutboundListingId("0x1234")).toBe(false);
    expect(isOutboundListingId("not-an-id")).toBe(false);
  });
});

describe("tracked env examples", () => {
  it("does not commit hex private keys", () => {
    const files = [".env.example", "contracts/.env.example"];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      expect(text).not.toMatch(/=\s*0x[a-fA-F0-9]{64}/);
      expect(text).not.toMatch(/sk_live_|sk-ant-|ghp_|gho_/);
    }
  });
});
