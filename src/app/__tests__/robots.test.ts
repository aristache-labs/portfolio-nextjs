import { describe, expect, it } from "vitest";
import robots from "../robots";

describe("robots", () => {
  const r = robots();
  const rules = Array.isArray(r.rules) ? r.rules : [r.rules];

  it("disallows /admin for the wildcard agent", () => {
    const wildcard = rules.find((x) => x.userAgent === "*")!;
    expect(wildcard.disallow).toContain("/admin");
  });

  it("explicitly allows known AI crawlers", () => {
    const agents = rules.map((x) => x.userAgent);
    expect(agents).toContain("GPTBot");
    expect(agents).toContain("ClaudeBot");
    expect(agents).toContain("PerplexityBot");
    expect(agents).toContain("Google-Extended");
  });

  it("blocks both private prefixes for every crawler and omits the nonstandard host field", () => {
    for (const rule of rules) {
      expect(rule.disallow).toEqual(["/admin", "/api"]);
      expect(rule.allow).toBe("/");
    }
    expect(r).not.toHaveProperty("host");
  });

  it("references the sitemap", () => {
    expect(r.sitemap).toMatch(/\/sitemap\.xml$/);
  });
});
