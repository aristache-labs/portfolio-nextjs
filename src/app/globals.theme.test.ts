import { readFileSync } from "fs";
import { join } from "path";
import { describe, it, expect } from "vitest";
import { BRAND, GROUND, INK, hexToRgb } from "@/lib/brand";

/**
 * Drift guard between brand.ts and globals.css. Every expectation is DERIVED from brand.ts,
 * never hardcoded: hardcoding the hexes in both places lets the test pass while the two files
 * disagree, which is how manifest.ts drifted to #07070c.
 */
describe("globals.css mirrors brand.ts", () => {
  const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf-8");

  it("registers the brand ramp as @theme colour tokens", () => {
    expect(css).toContain("@theme {");
    expect(css).toContain(`--color-brand-deep: ${BRAND.deep}`);
    expect(css).toContain(`--color-brand-mid: ${BRAND.mid}`);
    expect(css).toContain(`--color-brand-bright: ${BRAND.bright}`);
  });

  it("exposes the raw brand ramp for arbitrary-value utilities", () => {
    // Components use border-(--brand-deep)/40, which reads the bare name rather than
    // the --color-* namespace, so both have to exist and agree.
    expect(css).toContain(`--brand-deep: ${BRAND.deep}`);
    expect(css).toContain(`--brand-mid: ${BRAND.mid}`);
    expect(css).toContain(`--brand-bright: ${BRAND.bright}`);
  });

  it("mirrors the ramp as channel lists for arbitrary-value glows", () => {
    // Glows live in Tailwind arbitrary values, which cannot read brand.ts. Five stayed on the
    // old palette because they were literal decimal rgba() - invisible to a hex search.
    expect(css).toContain(`--brand-deep-rgb: ${hexToRgb(BRAND.deep).join(" ")}`);
    expect(css).toContain(`--brand-mid-rgb: ${hexToRgb(BRAND.mid).join(" ")}`);
    expect(css).toContain(`--brand-bright-rgb: ${hexToRgb(BRAND.bright).join(" ")}`);
  });

  it("mirrors the grounds and ink for both themes", () => {
    expect(css).toContain(`--bg: ${GROUND.light}`);
    expect(css).toContain(`--fg: ${INK.light}`);
    expect(css).toContain(`--bg: ${GROUND.dark}`);
    expect(css).toContain(`--fg: ${INK.dark}`);
  });

  it("keeps the @theme -> :root/.dark indirection that opacity modifiers depend on", () => {
    // Tailwind v4 only generates /40-style modifiers for colours registered in @theme,
    // and @theme cannot hold theme-switched values. Inlining a literal here instead of
    // var(--bg) silently kills every opacity modifier in the codebase.
    expect(css).toContain("--color-background: var(--bg)");
    expect(css).toContain("--color-foreground: var(--fg)");
    expect(css).toContain("--color-surface: var(--surface)");
  });

  it("defines the per-theme tokens in both theme blocks", () => {
    for (const token of [
      "--name-stroke",
      "--overlay-bg",
      "--chip-surface",
      "--accent-on-chip",
      "--period",
      "--gradient-brand",
      "--gradient-ink",
      "--nav-pill-opacity",
    ]) {
      const occurrences = css.match(new RegExp(`${token}:`, "g"))?.length ?? 0;
      expect(occurrences, `${token} should be set for light and dark`).toBeGreaterThanOrEqual(2);
    }
  });

  it("has a single brand ramp, with no runtime palette blocks", () => {
    // The palette picker is gone. A leftover [data-palette] block would be unreachable CSS
    // that could still recolor a page if the attribute ever came back.
    expect(css).not.toContain("[data-palette");
  });

  it("pins every route to Obsidian dark in layout.tsx", () => {
    // The homepage shields itself with [data-site="cinematic"]; Privacy, login, admin and
    // errors rely on the forced theme, so the OS preference cannot switch them to light.
    const layout = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf-8");
    expect(layout).toContain('forcedTheme="dark"');
    expect(layout).toContain("enableSystem={false}");
    expect(layout).not.toContain("palette");
  });

  it("defines the font tokens", () => {
    expect(css).toContain("--font-sans: var(--font-geist-sans)");
    expect(css).toContain("--font-mono: var(--font-geist-mono)");
  });
});
