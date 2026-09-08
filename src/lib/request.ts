export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || req.headers.get("x-real-ip")?.trim() || "unknown";
}

export class RequestTooLargeError extends Error {
  constructor() {
    super("Request body is too large.");
    this.name = "RequestTooLargeError";
  }
}

export function asJsonObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function stringField(obj: Record<string, unknown>, key: string, maxLen = 256): string {
  const value = obj[key];
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (trimmed.length > maxLen) return "";
  return trimmed;
}

export async function readJsonLimited(req: Request, maxBytes = 8_192): Promise<unknown | null> {
  const type = req.headers.get("content-type") ?? "";
  if (type && !type.toLowerCase().includes("application/json")) return null;
  const len = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(len) && len > maxBytes) throw new RequestTooLargeError();
  const buf = await req.arrayBuffer();
  if (buf.byteLength > maxBytes) throw new RequestTooLargeError();
  try {
    return JSON.parse(new TextDecoder().decode(buf));
  } catch {
    return null;
  }
}

export async function readTextLimited(req: Request, maxBytes = 32_768): Promise<string | null> {
  const len = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(len) && len > maxBytes) return null;
  const buf = await req.arrayBuffer();
  if (buf.byteLength > maxBytes) return null;
  return new TextDecoder().decode(buf);
}

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function publicHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}
