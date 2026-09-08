import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { asJsonObject, publicHttpUrl, stringField } from "./request";

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
