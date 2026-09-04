import { describe, expect, it } from "vitest";
import { ensIdentityRef, projectIdFromCanonical } from "./ids";

describe("ethbid ids", () => {
  it("hashes a stable project id from the canonical key", () => {
    const a = projectIdFromCanonical("web:example.xyz");
    const b = projectIdFromCanonical("web:example.xyz");
    expect(a).toBe(b);
    expect(a.startsWith("0x")).toBe(true);
    expect(a.length).toBe(66);
  });

  it("namehashes an ENS identity", () => {
    expect(ensIdentityRef("Ghoste.eth")).toBe(ensIdentityRef("ghoste.eth"));
  });
});
