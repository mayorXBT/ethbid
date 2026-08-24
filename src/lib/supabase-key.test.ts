import { describe, expect, it } from "vitest";
import { isPrivilegedSupabaseKey } from "./supabase-key";

function jwt(role: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ role })).toString("base64url");
  return `${header}.${payload}.sig`;
}

describe("isPrivilegedSupabaseKey", () => {
  it("accepts sb_secret_ and service_role JWTs", () => {
    expect(isPrivilegedSupabaseKey("sb_secret_abc")).toBe(true);
    expect(isPrivilegedSupabaseKey(jwt("service_role"))).toBe(true);
  });

  it("rejects publishable, anon, and empty keys", () => {
    expect(isPrivilegedSupabaseKey(undefined)).toBe(false);
    expect(isPrivilegedSupabaseKey("")).toBe(false);
    expect(isPrivilegedSupabaseKey("sb_publishable_abc")).toBe(false);
    expect(isPrivilegedSupabaseKey(jwt("anon"))).toBe(false);
    expect(isPrivilegedSupabaseKey("not-a-key")).toBe(false);
  });
});
