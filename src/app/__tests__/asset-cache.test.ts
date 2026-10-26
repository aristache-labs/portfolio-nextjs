import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const config = require("../../../next.config.js") as {
  headers: () => Promise<{ source: string; headers: { key: string; value: string }[] }[]>;
};

describe("asset caching", () => {
  it("caches only the asset directories without immutable", async () => {
    const rules = await config.headers();
    expect(rules.map(({ source }) => source)).toEqual([
      "/media/:path*",
      "/brand/:path*",
      "/fonts/:path*",
      "/icons/:path*",
      "/pwa/:path*",
    ]);
    for (const rule of rules) {
      const cache = rule.headers[0];
      expect(cache.key).toBe("Cache-Control");
      expect(cache.value).toContain("max-age=2592000");
      expect(cache.value).not.toContain("immutable");
    }
  });
});
