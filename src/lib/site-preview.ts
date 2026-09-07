export type SitePreview = {
  title: string | null;
  description: string | null;
};

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function siteFaviconUrl(host: string): string | null {
  const name = host.trim().toLowerCase();
  if (!name) return null;
  if (name.endsWith(".eth")) return `https://euc.li/${name}`;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(name)}&sz=128`;
}

export function parseSitePreview(html: string): SitePreview {
  let ogTitle: string | null = null;
  let ogDescription: string | null = null;
  let metaDescription: string | null = null;
  const metaRe = /<meta\b[^>]*>/gi;
  for (const tag of html.match(metaRe) ?? []) {
    const key = (attr(tag, "property") ?? attr(tag, "name") ?? "").trim().toLowerCase();
    const content = attr(tag, "content");
    if (content == null) continue;
    if (key === "og:title" && ogTitle == null) ogTitle = content;
    else if (key === "og:description" && ogDescription == null) ogDescription = content;
    else if (key === "description" && metaDescription == null) metaDescription = content;
  }
  const titleTag = html.match(/<title\b[^>]*>([^<]*)<\/title>/i);
  return {
    title: clean(ogTitle) ?? clean(titleTag?.[1] ?? null),
    description: clean(ogDescription) ?? clean(metaDescription),
  };
}

function attr(tag: string, name: string): string | null {
  const re = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i");
  const match = tag.match(re);
  if (!match) return null;
  return match[1] ?? match[2] ?? null;
}

function clean(value: string | null): string | null {
  if (value == null) return null;
  const text = decodeEntities(value).trim();
  return text || null;
}

function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, body: string) => {
    if (body[0] === "#") {
      const hex = body[1] === "x" || body[1] === "X";
      const n = Number.parseInt(hex ? body.slice(2) : body.slice(1), hex ? 16 : 10);
      if (!Number.isInteger(n) || n < 0 || n > 0x10ffff) return match;
      try {
        return String.fromCodePoint(n);
      } catch {
        return match;
      }
    }
    return ENTITIES[body.toLowerCase()] ?? match;
  });
}
