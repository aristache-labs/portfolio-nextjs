import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { ImageProps } from "next/image";
import manifest from "../manifest";
import { Footer } from "@/components/layout/Footer";
import { FeaturedCard } from "@/components/home/HighlightCards";
import type { MergedProject } from "@/lib/projects";

vi.mock("next/image", () => ({
  default: ({ src, alt, loading, width, height, sizes, className, style }: ImageProps) =>
    createElement("img", {
      src: String(src),
      alt,
      loading,
      width,
      height,
      sizes,
      className,
      style,
    }),
}));

describe("audit assets and server HTML", () => {
  it("serves the footer logo lazily with explicit dimensions and no preload", () => {
    const html = renderToString(<Footer socials={[]} />);
    const document = new DOMParser().parseFromString(html, "text/html");
    const logo = document.querySelector('img[src="/brand/logo-full-v2.webp"]');
    expect(logo?.getAttribute("loading")).toBe("lazy");
    expect(logo?.getAttribute("width")).toBe("400");
    expect(logo?.getAttribute("height")).toBe("415");
    expect(document.querySelector('link[rel="preload"][as="image"]')).toBeNull();
  });

  it("does not preload a Featured cover in server HTML", () => {
    const project = {
      title: "Sample",
      coverImage: "/brand/sample.webp",
      repo: "sample",
      tags: [],
    } as unknown as MergedProject;
    const html = renderToString(<FeaturedCard project={project} onQuickView={() => {}} />);
    expect(html).toContain('loading="lazy"');
    expect(html).not.toContain('rel="preload"');
  });

  it("declares real PNG icons at their encoded dimensions", () => {
    const icons = manifest().icons as { src: string; sizes: string; purpose: string }[];
    expect(icons.map(({ sizes, purpose }) => [sizes, purpose])).toEqual([
      ["192x192", "any"],
      ["512x512", "any"],
      ["512x512", "maskable"],
    ]);
    for (const icon of icons) {
      const png = readFileSync(resolve("public", icon.src.slice(1)));
      expect(png.subarray(1, 4).toString()).toBe("PNG");
      expect(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`).toBe(icon.sizes);
      if (icon.sizes === "512x512") {
        expect(png.length).toBeLessThan(70_000);
      }
    }
  });
});
