import { isCategory, type CategorySlug } from "./categories";

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "fbclid",
  "gclid",
  "gbraid",
  "wbraid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "igshid",
  "si",
  "ref",
  "ref_src",
  "s",
  "t",
]);

export interface NormalizedTarget {
  url: string;
  canonicalKey: string;
  handle: string | null;
  host: string;
}

export type TargetIdentity =
  | { kind: "empty" }
  | { kind: "handle" }
  | { kind: "ens"; name: string }
  | { kind: "domain"; host: string }
  | { kind: "url" };

const BARE_HOST = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;
const ENS_NAME = /^(?:[a-z0-9-]+\.)+eth$/i;

function stripWww(host: string): string {
  return host.replace(/^www\./i, "");
}

function isXHost(host: string): boolean {
  return host === "x.com" || host === "twitter.com" || host === "mobile.twitter.com";
}

function parseHandle(raw: string): string | null {
  const trimmed = raw.trim();
  const at = trimmed.match(/^@([A-Za-z0-9_]{1,15})$/);
  if (at) return at[1].toLowerCase();
  return null;
}

export function classifyTarget(input: string): TargetIdentity {
  const raw = input.trim();
  if (!raw) return { kind: "empty" };
  if (parseHandle(raw)) return { kind: "handle" };
  if (!raw.includes("://") && !raw.includes("/") && !raw.includes("?") && ENS_NAME.test(raw)) {
    return { kind: "ens", name: raw.toLowerCase() };
  }
  if (
    !raw.includes("://") &&
    !raw.includes("/") &&
    !raw.includes("?") &&
    !raw.toLowerCase().startsWith("www.") &&
    BARE_HOST.test(raw)
  ) {
    return { kind: "domain", host: stripWww(raw.toLowerCase()) };
  }
  return { kind: "url" };
}

export function normalizeTarget(input: string): NormalizedTarget | null {
  const raw = input.trim();
  if (!raw) return null;
  if (raw.length > 2048) return null;

  const handle = parseHandle(raw);
  if (handle) {
    return {
      url: `https://x.com/${handle}`,
      canonicalKey: `x:${handle}`,
      handle: `@${handle}`,
      host: "x.com",
    };
  }

  let candidate = raw;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  url.hash = "";
  url.hostname = stripWww(url.hostname.toLowerCase());
  url.protocol = "https:";
  url.username = "";
  url.password = "";
  url.port = "";

  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.has(key.toLowerCase()) || key.toLowerCase().startsWith("utm_")) {
      url.searchParams.delete(key);
    }
  }

  let pathname = url.pathname.replace(/\/+$/, "");
  if (pathname === "") pathname = "/";
  url.pathname = pathname;

  const host = url.hostname;

  if (isXHost(host)) {
    const user = pathname.split("/").filter(Boolean)[0];
    if (user && !["i", "home", "explore", "search", "intent"].includes(user.toLowerCase())) {
      const h = user.replace(/^@/, "").toLowerCase();
      return {
        url: `https://x.com/${h}`,
        canonicalKey: `x:${h}`,
        handle: `@${h}`,
        host: "x.com",
      };
    }
  }

  if (host === "github.com") {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      const key = `${parts[0].toLowerCase()}/${parts[1].toLowerCase()}`;
      return {
        url: `https://github.com/${key}`,
        canonicalKey: `gh:${key}`,
        handle: null,
        host,
      };
    }
  }

  if (host === "apps.apple.com") {
    const id = pathname.match(/id(\d+)/)?.[1];
    if (id) {
      return {
        url: `https://apps.apple.com/app/id${id}`,
        canonicalKey: `ios:${id}`,
        handle: null,
        host,
      };
    }
  }

  if (host === "play.google.com") {
    const id = url.searchParams.get("id");
    if (id) {
      return {
        url: `https://play.google.com/store/apps/details?id=${id}`,
        canonicalKey: `play:${id.toLowerCase()}`,
        handle: null,
        host,
      };
    }
  }

  const search = url.searchParams.toString();
  const href = `${url.origin}${pathname === "/" ? "" : pathname}${search ? `?${search}` : ""}`;
  return {
    url: href,
    canonicalKey: `web:${host}${pathname === "/" ? "" : pathname}`.toLowerCase(),
    handle: null,
    host,
  };
}

export function displayHost(url: string): string {
  try {
    return stripWww(new URL(url).hostname);
  } catch {
    return url;
  }
}

export function withCategory(url: string, slug: string): string {
  if (!isCategory(slug)) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("cat", slug);
    return parsed.toString();
  } catch {
    return url;
  }
}

export function categoryFromUrl(url: string): CategorySlug | null {
  try {
    const slug = new URL(url).searchParams.get("cat");
    if (slug && isCategory(slug)) return slug;
    return null;
  } catch {
    return null;
  }
}
