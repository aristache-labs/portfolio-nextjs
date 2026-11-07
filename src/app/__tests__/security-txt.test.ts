import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const text = readFileSync(join(process.cwd(), "public/.well-known/security.txt"), "utf8");

describe("security.txt", () => {
  it("meets RFC 9116 and prefers the private advisory", () => {
    expect(text).toContain(
      "Contact: https://github.com/aristache-labs/portfolio-nextjs/security/advisories/new",
    );
    expect(text).toContain("Contact: mailto:contact@aristache.dev");
    expect(text.indexOf("advisories/new")).toBeLessThan(text.indexOf("mailto:"));
    const expires = text.match(/^Expires: (.+)$/m)?.[1];
    expect(expires).toBeTruthy();
    expect(new Date(expires!).getTime()).toBeGreaterThan(Date.now());
    expect(text).toContain("Canonical: https://www.aristache.dev/.well-known/security.txt");
    expect(text).toContain(
      "Policy: https://github.com/aristache-labs/portfolio-nextjs/blob/master/SECURITY.md",
    );
    expect(text).toContain("Preferred-Languages: en");
  });
});
