import { afterEach, describe, expect, it } from "vitest";
import { serverEnv } from "./env";

const original = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in original)) delete process.env[key];
  }
  Object.assign(process.env, original);
});

describe("serverEnv", () => {
  it("reads a runtime value by name", () => {
    process.env.LONG_BID_TEST_SECRET = "  abc  ";
    expect(serverEnv("LONG_BID_TEST_SECRET")).toBe("abc");
  });

  it("returns empty string when unset", () => {
    delete process.env.LONG_BID_TEST_SECRET;
    expect(serverEnv("LONG_BID_TEST_SECRET")).toBe("");
  });
});
