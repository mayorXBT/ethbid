import postgres from "postgres";
import { serverEnv } from "./env";

const g = globalThis as unknown as { __longbidSql?: ReturnType<typeof postgres> };

export function databaseUrl(): string {
  return serverEnv("DATABASE_URL");
}

export function isBuildPhase() {
  return serverEnv("NEXT_PHASE") === "phase-production-build";
}

export function pg() {
  if (isBuildPhase()) return null;
  const url = databaseUrl();
  if (!url) return null;
  // New Supabase projects resolve db.*.supabase.co to IPv6 only. Skip when we cannot use it.
  if (/db\.[a-z0-9]+\.supabase\.co:5432/i.test(url) && !serverEnv("DATABASE_FORCE_DIRECT")) {
    return null;
  }
  if (!g.__longbidSql) {
    g.__longbidSql = postgres(url, {
      ssl: "require",
      max: 5,
      idle_timeout: 20,
      connect_timeout: 20,
    });
  }
  return g.__longbidSql;
}
