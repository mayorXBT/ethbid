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

export async function readJsonLimited(req: Request, maxBytes = 8_192): Promise<unknown | null> {
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
