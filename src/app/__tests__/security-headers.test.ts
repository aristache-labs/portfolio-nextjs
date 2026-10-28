import { createRequire } from "node:module";
import { afterEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const configPath = require.resolve("../../../next.config.js");

type Config = {
  headers: () => Promise<{ source: string; headers: { key: string; value: string }[] }[]>;
  images: { remotePatterns: { protocol: string; hostname: string }[] };
};

function loadConfig(mode: string): Config {
  vi.stubEnv("NODE_ENV", mode);
  delete require.cache[configPath];
  return require(configPath);
}

async function security(config: Config) {
  const rules = await config.headers();
  const globalRule = rules.find(({ source }) => source === "/:path*")!;
  return new Map(globalRule.headers.map(({ key, value }) => [key, value]));
}

afterEach(() => {
  vi.unstubAllEnvs();
  delete require.cache[configPath];
});

describe("security headers", () => {
  it("protects all routes with CSP enforcement and HSTS including subdomains without preload", async () => {
    const headers = await security(loadConfig("production"));
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("Permissions-Policy")).toBe("camera=(), microphone=(), geolocation=()");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.has("Content-Security-Policy-Report-Only")).toBe(false);
    expect(headers.get("Strict-Transport-Security")).toBe("max-age=63072000; includeSubDomains");
    const csp = headers.get("Content-Security-Policy")!;
    expect(csp).not.toMatch(/nonce-|unsafe-eval|upgrade-insecure-requests/);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
  });

  it("covers production image hosts, including wildcard apex hosts, and Quick View badges", async () => {
    const config = loadConfig("production");
    const csp = (await security(config)).get("Content-Security-Policy")!;
    const images = csp
      .split("; ")
      .find((part) => part.startsWith("img-src "))!
      .split(" ");
    expect(images).toEqual(
      expect.arrayContaining([
        "'self'",
        "data:",
        "blob:",
        "https://img.shields.io",
        "https://*.google-analytics.com",
        "https://*.googletagmanager.com",
      ]),
    );
    for (const { protocol, hostname } of config.images.remotePatterns) {
      if (hostname === "localhost") continue;
      const source =
        protocol + "://" + hostname.replace("**.", "*.") + (protocol === "http" ? ":*" : "");
      expect(images).toContain(source);
      if (hostname.startsWith("**.")) {
        expect(images).toContain(protocol + "://" + hostname.slice(3));
      }
    }
    expect(images).not.toContain("https:");
    expect(images).not.toContain("*");
  });

  it("allows only the required Google analytics hosts and GitHub sign-in", async () => {
    const csp = (await security(loadConfig("production"))).get("Content-Security-Policy")!;
    const directives = csp.split("; ");
    expect(directives).toContain(
      "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
    );
    expect(directives).toContain(
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
    );
    expect(directives).toContain("style-src 'self' 'unsafe-inline'");
    expect(directives).toContain("font-src 'self'");
    expect(directives).toContain("media-src 'self'");
    expect(directives).toContain("form-action 'self' https://github.com");
    expect(csp).not.toContain("vercel-insights.com");
  });

  it("allows the development runtime without relaxing the production policy", async () => {
    const dev = (await security(loadConfig("development"))).get("Content-Security-Policy")!;
    expect(dev).toContain("'unsafe-eval'");
    expect(dev).not.toContain("https://va.vercel-scripts.com");
    expect(dev).toContain("ws://localhost:*");
    expect(dev).toContain("http://localhost:*");
    const production = (await security(loadConfig("production"))).get("Content-Security-Policy")!;
    expect(production).not.toContain("'unsafe-eval'");
    expect(production).not.toContain("ws://");
    expect(production).not.toContain("localhost");
  });
});
