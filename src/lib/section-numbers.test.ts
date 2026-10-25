import { describe, expect, it } from "vitest";
import { sectionNumbers } from "./section-numbers";

describe("sectionNumbers", () => {
  it("keeps the original order when all sections are enabled", () => {
    expect(sectionNumbers({})).toEqual({
      about: "01",
      skills: "02",
      experience: "03",
      projects: "04",
      services: "05",
      contact: "06",
    });
  });

  it("numbers Contact immediately after Projects when Services is disabled", () => {
    expect(sectionNumbers({ services: false })).toEqual({
      about: "01",
      skills: "02",
      experience: "03",
      projects: "04",
      contact: "05",
    });
  });

  it("has no gaps for every combination of section toggles", () => {
    const ids = ["about", "skills", "experience", "projects", "services", "contact"];
    for (let mask = 0; mask < 64; mask++) {
      const visibility = Object.fromEntries(
        ids.map((id, index) => [id, Boolean(mask & (1 << index))]),
      );
      const numbers = sectionNumbers(visibility);
      const enabled = ids.filter((id) => visibility[id]);
      expect(Object.keys(numbers)).toEqual(enabled);
      expect(Object.values(numbers)).toEqual(
        enabled.map((_, index) => String(index + 1).padStart(2, "0")),
      );
    }
  });
});
