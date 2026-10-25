import { BRAND } from "@/lib/brand";

// These ramps drive the picker swatches while globals.css applies the actual tokens;
// globals.theme.test.ts asserts they match, so a mismatch cannot show one colour and apply
// another. Obsidian takes its ramp from brand.ts rather than repeating it here.
export const DEFAULT_PALETTE = "obsidian";

export type PaletteId = "obsidian" | "iris" | "glacier" | "ember" | "verdant";

// Iris keeps the previous default ramp. It must not follow BRAND, or it would track Obsidian.
const IRIS_RAMP = ["#3730a3", "#7c3aed", "#c084fc"] as const;

export const PALETTES: ReadonlyArray<{
  id: PaletteId;
  label: string;
  ramp: readonly [string, string, string];
}> = [
  { id: "obsidian", label: "Obsidian", ramp: [BRAND.deep, BRAND.mid, BRAND.bright] },
  { id: "iris", label: "Iris", ramp: IRIS_RAMP },
  { id: "glacier", label: "Glacier", ramp: ["#155e75", "#0891b2", "#22d3ee"] },
  { id: "ember", label: "Ember", ramp: ["#7c2d12", "#d97706", "#fbbf24"] },
  { id: "verdant", label: "Verdant", ramp: ["#14532d", "#059669", "#34d399"] },
];

export const PALETTE_IDS = PALETTES.map((p) => p.id);

export function isPaletteId(value: unknown): value is PaletteId {
  return typeof value === "string" && (PALETTE_IDS as string[]).includes(value);
}

/** Magenta was removed. A stored copy resolves to Obsidian. Other unknown values do too. */
export function resolveStoredPalette(stored: string | null): PaletteId {
  if (stored === "magenta") return DEFAULT_PALETTE;
  return isPaletteId(stored) ? stored : DEFAULT_PALETTE;
}

// Also hardcoded in the pre-paint script in layout.tsx, which clears it on every load.
export const PALETTE_STORAGE_KEY = "palette";
