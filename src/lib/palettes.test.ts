import { describe, expect, it } from "vitest";
import { DEFAULT_PALETTE, PALETTES, resolveStoredPalette } from "./palettes";

describe("palette registry", () => {
  it("lists Aristache first and keeps exactly the five palettes", () => {
    expect(PALETTES.map((p) => p.id)).toEqual(["aristache", "iris", "glacier", "ember", "verdant"]);
    expect(DEFAULT_PALETTE).toBe("aristache");
  });

  it("migrates a stored Magenta choice to Aristache and leaves the other four alone", () => {
    expect(resolveStoredPalette("magenta")).toBe("aristache");
    expect(resolveStoredPalette(null)).toBe("aristache");
    expect(resolveStoredPalette("nope")).toBe("aristache");
    expect(resolveStoredPalette("iris")).toBe("iris");
    expect(resolveStoredPalette("glacier")).toBe("glacier");
    expect(resolveStoredPalette("ember")).toBe("ember");
    expect(resolveStoredPalette("verdant")).toBe("verdant");
  });
});
