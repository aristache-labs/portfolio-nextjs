import { describe, expect, it } from "vitest";
import { aboutStatsFromForm, getAboutStats } from "./about-stats";
import { profileInsertSchema } from "./schemas";

describe("About statistics", () => {
  it("keeps legacy cards while allowing saved values, labels and hidden cards", () => {
    expect(getAboutStats({}).map(({ value }) => value)).toEqual(["60%", "1,600+", "5", "8+"]);
    const cards = getAboutStats({
      manualWorkReduction: "75%",
      manualWorkReductionLabel: "Time saved",
      teamSize: "",
      deploymentLocationsLabel: "",
      years: 42,
    });
    expect(cards).toHaveLength(2);
    expect(cards[0]).toMatchObject({ value: "75%", label: "Time saved" });
    expect(cards[1].value).toBe("8+");
  });

  it("trims native form fields and keeps explicit blanks for hidden cards", () => {
    const form = new FormData();
    form.set("manualWorkReduction", " 72% ");
    form.set("manualWorkReductionLabel", " Hours saved ");
    expect(aboutStatsFromForm(form)).toMatchObject({
      manualWorkReduction: "72%",
      manualWorkReductionLabel: "Hours saved",
      teamSize: "",
    });
  });

  it("validates card limits server-side without changing unrelated statistics", () => {
    const base = { name: "Name", bio: "Bio" };
    const stats = {
      repos: 120,
      manualWorkReduction: "72%",
      manualWorkReductionLabel: "Time saved",
    };
    expect(profileInsertSchema.parse({ ...base, stats }).stats).toEqual(stats);
    expect(
      profileInsertSchema.safeParse({ ...base, stats: { teamSize: "x".repeat(25) } }).success,
    ).toBe(false);
    expect(
      profileInsertSchema.safeParse({ ...base, stats: { teamSizeLabel: "x".repeat(81) } }).success,
    ).toBe(false);
  });
});
