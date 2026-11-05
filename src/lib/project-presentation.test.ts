import { describe, expect, it } from "vitest";
import { fixture } from "@/test/project-fixture";
import { cardDescription, groupProjects, liveFirst } from "./project-presentation";
import { projectInsertSchema } from "./schemas";

describe("project presentation", () => {
  it("keeps the full description separate from the card pitch", () => {
    const project = fixture(1, { tagline: " Short pitch ", description: "Long documentation" });
    expect(cardDescription(project)).toBe("Short pitch");
    expect(project.description).toBe("Long documentation");
  });
  it("cuts long text at a word boundary including the ellipsis in the budget", () => {
    const description = "Complete words ".repeat(25);
    const result = cardDescription(fixture(1, { description }));
    expect(result.length).toBeLessThanOrEqual(140);
    expect(result).toMatch(/words\.\.\.$|Complete\.\.\.$/);
    expect(cardDescription(fixture(2, { description: null }))).toBe("");
  });
  it("groups before allocation, hides members and chooses order then id", () => {
    const result = groupProjects([
      fixture(3, {
        group: " MITUGYM ",
        featured: true,
        homepage: "https://example.com",
        pushedAt: new Date("2026-11-01"),
      }),
      fixture(2, { group: "mitugym", order: 0 }),
      fixture(1, { group: "mitugym", order: 0 }),
      fixture(4, { group: "mitugym", order: -1, hidden: true }),
      fixture(5),
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[0].components.map((p) => p.id)).toEqual([1, 2, 3]);
    expect(result[0].featured).toBe(true);
    expect(result[0].hasLive).toBe(true);
    expect(result[0].stars).toBe(1);
    expect(result[0].pushedAt).toEqual(new Date("2026-11-01"));
  });
  it("sorts Live before development while retaining editorial ties", () => {
    const result = groupProjects([
      fixture(1),
      fixture(2, { homepage: "https://example.com" }),
      fixture(3),
    ]);
    expect(result.sort(liveFirst).map((p) => p.id)).toEqual([2, 1, 3]);
  });
  it.each([
    [" MITUGYM ", "mitugym"],
    [" ", null],
    [undefined, null],
  ])("normalizes group %s", (group, expected) => {
    expect(projectInsertSchema.parse({ repo: "app", title: "App", group }).group).toBe(expected);
  });
});
