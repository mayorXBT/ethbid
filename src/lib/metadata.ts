export interface SiteMeta {
  name: string;
  description: string;
  faviconUrl: string | null;
  ogImageUrl: string | null;
}

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`${name}=["']([^"']+)["']`, "i"));
  return m?.[1] ?? null;
}

function decode(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function cap(value: string, max: number): string {
  return value.trim().slice(0, max);
}

export async function fetchSiteMeta(url: string): Promise<SiteMeta> {
  const fallbackHost = new URL(url).hostname.replace(/^www\./, "");
  const fallback: SiteMeta = {
    name: cap(fallbackHost, 120),
    description: "",
    faviconUrl: `https://www.google.com/s2/favicons?domain=${fallbackHost}&sz=64`,
    ogImageUrl: null,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "LongbidBot/1.0 (+https://longbid.lol)",
        accept: "text/html",
      },
      redirect: "follow",
    });
    if (!res.ok) return fallback;
    const html = (await res.text()).slice(0, 120_000);

    const metas = [...html.matchAll(/<meta\s[^>]*>/gi)].map((m) => m[0]);
    const pick = (...keys: string[]) => {
      for (const key of keys) {
        for (const tag of metas) {
          const prop = (attr(tag, "property") ?? attr(tag, "name") ?? "").toLowerCase();
          if (prop === key) {
            const content = attr(tag, "content");
            if (content) return decode(content);
          }
        }
      }
      return null;
    };

    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
    const iconHref =
      html.match(/<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]*>/i)?.[0] ??
      html.match(/<link[^>]+rel=["']apple-touch-icon["'][^>]*>/i)?.[0];
    const icon = iconHref ? attr(iconHref, "href") : null;

    const resolve = (maybe: string | null) => {
      if (!maybe) return null;
      try {
        return new URL(maybe, url).toString();
      } catch {
        return null;
      }
    };

    return {
      name: cap(pick("og:site_name", "og:title", "twitter:title") ?? decode(title ?? fallbackHost), 120),
      description: cap(pick("og:description", "description", "twitter:description") ?? "", 280),
      faviconUrl: resolve(icon) ?? fallback.faviconUrl,
      ogImageUrl: resolve(pick("og:image", "twitter:image")),
    };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
