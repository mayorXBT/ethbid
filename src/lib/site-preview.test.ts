import { describe, expect, it } from "vitest";
import { parseSitePreview } from "./site-preview";

describe("parseSitePreview", () => {
  it("prefers og:title and og:description", () => {
    const preview = parseSitePreview(`
      <html>
        <head>
          <title>Fallback title</title>
          <meta property="og:title" content="Ghoste">
          <meta name="description" content="Fallback description">
          <meta property="og:description" content="Onchain discovery">
        </head>
      </html>
    `);
    expect(preview).toEqual({ title: "Ghoste", description: "Onchain discovery" });
  });

  it("falls back to title and meta description", () => {
    const preview = parseSitePreview(`
      <title>Example Site</title>
      <meta name="description" content="A product on the open web">
    `);
    expect(preview).toEqual({
      title: "Example Site",
      description: "A product on the open web",
    });
  });

  it("reads content before property", () => {
    const preview = parseSitePreview(
      `<meta content='Mayor &amp; Co' property='og:title'><meta content="We rank bids" name="og:description">`,
    );
    expect(preview).toEqual({ title: "Mayor & Co", description: "We rank bids" });
  });

  it("decodes basic HTML entities", () => {
    const preview = parseSitePreview(
      `<title>Foo &amp; Bar &#39;s &quot;shop&quot;</title><meta name="description" content="A &lt;bid&gt; for &nbsp; $5">`,
    );
    expect(preview.title).toBe(`Foo & Bar 's "shop"`);
    expect(preview.description).toBe("A <bid> for   $5");
  });

  it("returns nulls when tags are missing", () => {
    expect(parseSitePreview("<html><body>no metadata</body></html>")).toEqual({
      title: null,
      description: null,
    });
    expect(parseSitePreview("")).toEqual({ title: null, description: null });
  });
});
