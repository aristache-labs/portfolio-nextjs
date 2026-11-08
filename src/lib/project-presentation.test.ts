import { describe, expect, it } from "vitest";
import { fixture } from "@/test/project-fixture";
import {
  cardDescription,
  currentlyBuilding,
  groupProjects,
  liveFirst,
  pushedLabel,
} from "./project-presentation";
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

  it("picks the newest push even when that project already has a live site", () => {
    const projects = groupProjects([
      fixture(1, { homepage: "https://live.example", pushedAt: new Date("2026-11-04") }),
      fixture(2, { pushedAt: new Date("2026-10-20") }),
      fixture(3, { pushedAt: new Date("2026-10-28") }),
    ]);
    expect(currentlyBuilding(projects)?.id).toBe(1);
  });
  it("picks a development project when it has the newest push", () => {
    const projects = groupProjects([
      fixture(1, { homepage: "https://live.example", pushedAt: new Date("2026-10-20") }),
      fixture(2, { pushedAt: new Date("2026-11-04") }),
    ]);
    expect(currentlyBuilding(projects)?.id).toBe(2);
  });
  it("breaks equal push dates by ascending id", () => {
    const projects = groupProjects([
      fixture(2, { featured: true, pushedAt: new Date("2026-11-04") }),
      fixture(1, { pushedAt: new Date("2026-11-04") }),
    ]);
    expect(currentlyBuilding(projects)?.id).toBe(1);
  });
  it("uses the newest visible group member and ignores hidden projects", () => {
    const projects = groupProjects([
      fixture(1, { group: "app", homepage: "https://live.example" }),
      fixture(2, { group: "app", pushedAt: new Date("2026-11-04") }),
      fixture(3, { pushedAt: new Date("2026-10-28") }),
      fixture(4, { group: "app", hidden: true, pushedAt: new Date("2026-11-07") }),
      fixture(5, { hidden: true, pushedAt: new Date("2026-11-08") }),
    ]);
    expect(currentlyBuilding(projects)?.id).toBe(1);
    expect(currentlyBuilding(projects)?.pushedAt).toEqual(new Date("2026-11-04"));
  });
  it("ignores missing push dates and returns nothing when none are available", () => {
    const live = groupProjects([
      fixture(1, { homepage: "https://a.example", pushedAt: new Date("2026-09-01") }),
      fixture(2, { homepage: "https://b.example", pushedAt: new Date("2026-10-01") }),
      fixture(3, { featured: true, pushedAt: null }),
    ]);
    expect(currentlyBuilding(live)?.id).toBe(2);
    expect(currentlyBuilding(groupProjects([fixture(1, { pushedAt: null })]))).toBeNull();
    expect(currentlyBuilding([])).toBeNull();
  });
  it("prints the push date in UTC so server and browser agree", () => {
    expect(pushedLabel(new Date("2026-11-04T23:30:00Z"))).toBe("Nov 4");
  });
});
