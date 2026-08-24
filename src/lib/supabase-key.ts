export function isPrivilegedSupabaseKey(key: string | undefined | null): boolean {
  const value = key?.trim() ?? "";
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
