import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeJsonLd, PersonJsonLd, WebSiteJsonLd } from "../jsonld";

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

  it("emits a ProfilePage and a project ItemList tied to the Person id", () => {
    const { container } = render(
      <HomeJsonLd
        skills={[{ name: "PowerShell" }, { name: "PowerShell" }, { name: "Next.js" }]}
        projects={[
          {
            title: "Rippl",
            description: "A thing.",
            htmlUrl: "https://github.com/aristache-labs/rippl",
            homepage: null,
            language: "Dart",
          },
          { title: "No repo", description: null, htmlUrl: null, homepage: null, language: null },
        ]}
      />,
    );
    const [profile, list] = [...container.querySelectorAll("script")].map((s) =>
      parse(s.innerHTML),
    );
    const personId = parse(render(<PersonJsonLd />).container.querySelector("script")!.innerHTML)[
      "@id"
    ];
    expect(profile["@type"]).toBe("ProfilePage");
    expect(profile.mainEntity["@id"]).toBe(personId);
    expect(profile.mainEntity.knowsAbout).toEqual(["PowerShell", "Next.js"]);
    expect(list["@type"]).toBe("ItemList");
    expect(list.itemListElement).toHaveLength(1);
    expect(list.itemListElement[0].item).toMatchObject({
      "@type": "SoftwareSourceCode",
      name: "Rippl",
      programmingLanguage: "Dart",
      author: { "@id": personId },
    });
  });
});
