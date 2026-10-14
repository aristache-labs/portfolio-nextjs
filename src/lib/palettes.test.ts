import { describe, expect, it } from "vitest";
import { DEFAULT_PALETTE, PALETTES, resolveStoredPalette } from "./palettes";

describe("palette registry", () => {
  it("lists Obsidian first and keeps exactly the five palettes", () => {
    expect(PALETTES.map((p) => p.id)).toEqual(["obsidian", "iris", "glacier", "ember", "verdant"]);
    expect(DEFAULT_PALETTE).toBe("obsidian");
  });

  it("migrates a stored Magenta choice to Aristache and leaves the other four alone", () => {
    expect(resolveStoredPalette("magenta")).toBe("obsidian");
    expect(resolveStoredPalette(null)).toBe("obsidian");
    expect(resolveStoredPalette("nope")).toBe("obsidian");
    expect(resolveStoredPalette("iris")).toBe("iris");
    expect(resolveStoredPalette("glacier")).toBe("glacier");
    expect(resolveStoredPalette("ember")).toBe("ember");
    expect(resolveStoredPalette("verdant")).toBe("verdant");
  });
});
