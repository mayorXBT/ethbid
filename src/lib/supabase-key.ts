function normalizeKey(key: string | undefined | null): string {
  return key?.trim().replace(/^["']|["']$/g, "") ?? "";
}

export function describeSupabaseWriteKey(key: string | undefined | null): string {
  const value = normalizeKey(key);
  if (!value) return "missing";
  if (value.startsWith("sb_publishable_")) return "publishable";
  if (value.startsWith("sb_secret_")) return "sb_secret";
  if (value.startsWith("eyJ")) {
    try {
      const payload = JSON.parse(Buffer.from(value.split(".")[1] ?? "", "base64url").toString("utf8")) as {
        role?: string;
      };
      return `jwt:${payload.role ?? "unknown"}`;
    } catch {
      return "jwt:undecodable";
    }
  }
  return `other:${value.slice(0, 12)}`;
}

export function isPrivilegedSupabaseKey(key: string | undefined | null): boolean {
  const value = normalizeKey(key);
  if (!value) return false;
  if (value.startsWith("sb_publishable_")) return false;
  if (value.startsWith("sb_secret_")) return true;
  if (!value.startsWith("eyJ")) return false;
  try {
    const payload = JSON.parse(Buffer.from(value.split(".")[1] ?? "", "base64url").toString("utf8")) as {
      role?: string;
    };
    return payload.role === "service_role";
  } catch {
    return false;
  }
}
