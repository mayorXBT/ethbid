import { describe, expect, it } from "vitest";
import { matchTxtRecords, matchWellKnown, normalizeDomain, wellKnownBody } from "./domain-challenge";

describe("domain challenge matching", () => {
  const wallet = "0x1111111111111111111111111111111111111111";
  const nonce = "abc123";

  it("normalizes a host", () => {
    expect(normalizeDomain("https://www.Example.XYZ/path")).toBe("example.xyz");
    expect(normalizeDomain("not a domain")).toBeNull();
  });

  it("matches well-known JSON", () => {
    const json = JSON.parse(wellKnownBody(wallet, nonce));
    expect(matchWellKnown(json, wallet, nonce)).toBe(true);
    expect(matchWellKnown({ wallet, nonce: "nope" }, wallet, nonce)).toBe(false);
  });

  it("matches a DNS TXT line that carries nonce and wallet", () => {
    expect(matchTxtRecords([[`ethbid-verify=${nonce};wallet=${wallet}`]], wallet, nonce)).toBe(true);
    expect(matchTxtRecords([["unrelated"]], wallet, nonce)).toBe(false);
  });
});
