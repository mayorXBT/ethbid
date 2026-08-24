import postgres from "postgres";

const g = globalThis as unknown as { __longbidSql?: ReturnType<typeof postgres> };

export function databaseUrl(): string {
  return process.env.DATABASE_URL?.trim() ?? "";
}

export function pg() {
  const url = databaseUrl();
  if (!url) return null;
  // New Supabase projects resolve db.*.supabase.co to IPv6 only. Skip when we cannot use it.
  if (/db\.[a-z0-9]+\.supabase\.co:5432/i.test(url) && !process.env.DATABASE_FORCE_DIRECT) {
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
