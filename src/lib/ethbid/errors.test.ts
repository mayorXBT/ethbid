import { describe, expect, it } from "vitest";
import { plainEthbidError } from "./errors";

describe("plainEthbidError", () => {
  it("maps wallet and ENS failures to short copy", () => {
    expect(plainEthbidError(new Error("User rejected the request"))).toMatch(/rejected/i);
    expect(plainEthbidError(new Error("ENS name not found"))).toBe("ENS name not found.");
    expect(plainEthbidError(new Error("Connected wallet does not control that ENS identity."))).toMatch(/does not control/);
  });
});
