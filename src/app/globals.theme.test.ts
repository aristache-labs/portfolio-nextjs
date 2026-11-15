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

  it("loads Tailwind first", () => {
    // Without the import every utility class silently disappears while the build still
    // passes, so the page renders unstyled with nothing failing.
    expect(css.startsWith('@import "tailwindcss";')).toBe(true);
  });

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

  it("mirrors the ground and ink", () => {
    expect(css).toContain(`--bg: ${GROUND.dark}`);
    expect(css).toContain(`--fg: ${INK.dark}`);
  });

  it("keeps the @theme -> :root indirection that opacity modifiers depend on", () => {
    // Tailwind v4 only generates /40-style modifiers for colours registered in @theme.
    // Inlining a literal here instead of var(--bg) silently kills every opacity modifier
    // in the codebase.
    expect(css).toContain("--color-background: var(--bg)");
    expect(css).toContain("--color-foreground: var(--fg)");
    expect(css).toContain("--color-surface: var(--surface)");
  });

  it("defines the component tokens", () => {
    for (const token of [
      "--overlay-bg",
      "--chip-surface",
      "--accent-on-chip",
      "--period",
      "--gradient-brand",
      "--gradient-brand-action",
      "--gradient-ink",
    ]) {
      expect(css, `${token} should be defined`).toContain(`${token}:`);
    }
  });

  it("keeps white text at 4.5:1 on both ends of the action gradient", () => {
    const stops = css.match(
      /--gradient-brand-action: linear-gradient\(135deg, (#[0-9a-f]{6}) 0%, (#[0-9a-f]{6}) 100%\)/i,
    );
    expect(stops, "--gradient-brand-action should be a two-stop gradient").not.toBeNull();
    const luminance = (hex: string) => {
      const [r, g, b] = hexToRgb(hex).map((c) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    for (const stop of [stops![1], stops![2]]) {
      expect(1.05 / (luminance(stop) + 0.05), `white on ${stop}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("has no light theme left to switch to", () => {
    // Obsidian dark is the only theme, so the tokens live in :root alone. A .dark override
    // block or a theme-ready transition guard would be leftovers of the removed switch.
    expect(css).toContain("color-scheme: dark");
    expect(css).not.toMatch(/^\.dark\s*\{/m);
    expect(css).not.toContain("theme-ready");
  });

  it("has a single brand ramp, with no runtime palette blocks", () => {
    // The palette picker is gone. A leftover [data-palette] block would be unreachable CSS
    // that could still recolor a page if the attribute ever came back.
    expect(css).not.toContain("[data-palette");
  });

  it("pins every route to Obsidian dark in layout.tsx", () => {
    // A static `dark` class keeps the `dark:` variant working with no theme provider, so
    // nothing at runtime can switch a route to light.
    const layout = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf-8");
    expect(layout).toMatch(/className=\{`dark /);
    expect(layout).not.toContain("ThemeProvider");
    expect(layout).not.toContain("theme-ready");
    expect(layout).not.toContain("palette");
  });

  it("defines the font tokens", () => {
    expect(css).toContain("--font-sans: var(--font-geist-sans)");
    expect(css).toContain("--font-mono: var(--font-geist-mono)");
  });
});
