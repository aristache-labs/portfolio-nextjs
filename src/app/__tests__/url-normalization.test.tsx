import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("public root URLs", () => {
  it.each(["https://example.com", "https://example.com/"])(
    "normalizes canonical and discovery URLs from %s",
    async (origin) => {
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", origin);
      vi.resetModules();
      const [{ default: sitemap }, { default: robots }, { GET }, { PersonJsonLd, WebSiteJsonLd }] =
        await Promise.all([
          import("../sitemap"),
          import("../robots"),
          import("../llms.txt/route"),
          import("@/lib/seo/jsonld"),
        ]);
      expect(sitemap().map(({ url }) => url)).toEqual([
        "https://example.com/",
        "https://example.com/privacy",
        "https://example.com/gdpr",
      ]);
      expect(robots().sitemap).toBe("https://example.com/sitemap.xml");
      const llms = await GET().text();
      expect(llms).toContain("[Full profile](https://example.com/llms-full.txt)");
      expect(llms).toContain("[Portfolio](https://example.com/)");
      for (const Component of [PersonJsonLd, WebSiteJsonLd]) {
        const html = renderToStaticMarkup(<Component />);
        const doc = new DOMParser().parseFromString(html, "text/html");
        const data = JSON.parse(doc.querySelector("script")!.textContent!);
        expect(data.url).toBe("https://example.com/");
        if (data.image) expect(data.image).toBe("https://example.com/opengraph-image");
      }
    },
  );
});
