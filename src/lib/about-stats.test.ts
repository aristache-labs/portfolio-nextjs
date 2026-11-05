import { describe, expect, it } from "vitest";
import { ABOUT_STATS, aboutStats, mergeAboutStats } from "./about-stats";

describe("aboutStats", () => {
  it("falls back to the defaults when nothing is stored", () => {
    expect(aboutStats(null)).toEqual(
      ABOUT_STATS.map(({ key, value, label }) => ({ key, value, label })),
    );
  });

  it("uses stored values and labels, ignoring blanks", () => {
    const [first, second] = aboutStats({
      manualWorkReduction: "70%",
      manualWorkReductionLabel: "Less toil",
      deploymentLocations: "  ",
    });
    expect(first).toEqual({ key: "manualWorkReduction", value: "70%", label: "Less toil" });
    expect(second.value).toBe(ABOUT_STATS[1].value);
  });
});

describe("mergeAboutStats", () => {
  it("keeps the GitHub counters and removes emptied card fields", () => {
    const fields: Record<string, string> = {
      teamSize: "7",
      teamSizeLabel: "",
      experienceYears: "9+",
    };
    const merged = mergeAboutStats(
      { repos: 6, followers: 3, teamSizeLabel: "Old label", manualWorkReduction: "60%" },
      (name) => fields[name] ?? "",
    );
    expect(merged).toEqual({ repos: 6, followers: 3, teamSize: "7", experienceYears: "9+" });
  });
});
