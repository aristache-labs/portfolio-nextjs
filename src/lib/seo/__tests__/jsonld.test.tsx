import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PersonJsonLd, WebSiteJsonLd } from "../jsonld";

function parse(html: string) {
  return JSON.parse(html);
}

describe("JSON-LD", () => {
  it("emits a valid Person schema with sameAs links", () => {
    const { container } = render(<PersonJsonLd />);
    const script = container.querySelector('script[type="application/ld+json"]')!;
    const data = parse(script.innerHTML);
    expect(data["@type"]).toBe("Person");
    expect(data.name).toBe("Adrian Cristache");
    expect(data.givenName).toBe("Adrian");
    expect(data.familyName).toBe("Cristache");
    expect(data.alternateName).toEqual(["Cristache Adrian", "Aristache"]);
    expect(data.jobTitle).toBe("IT Specialist · Web & Mobile Developer");
    expect(data.description).toContain("Web and mobile projects in my spare time.");
    expect(Array.isArray(data.sameAs)).toBe(true);
    expect(data.sameAs).toEqual([
      "https://github.com/aristache-labs",
      "https://www.linkedin.com/in/adrian-cristache-727773444",
    ]);
  });

  it("emits a valid WebSite schema", () => {
    const { container } = render(<WebSiteJsonLd />);
    const data = parse(container.querySelector("script")!.innerHTML);
    expect(data["@type"]).toBe("WebSite");
    expect(data.alternateName).toEqual(["Aristache"]);
    expect(data).not.toHaveProperty("givenName");
    expect(data).not.toHaveProperty("familyName");
    expect(data.url).toMatch(/^https?:\/\//);
  });
});
