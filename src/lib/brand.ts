// globals.css mirrors these as CSS variables by hand (CSS cannot import TS) and
// globals.theme.test.ts fails if the two drift. Consumers that cannot read a CSS variable
// import from here instead: opengraph-image, manifest, notify, the canvas and repo badges.
// Obsidian dark is the only theme. See AGENTS.md.

export const BRAND = {
  deep: "#0f6e68",
  mid: "#58e5d0",
  bright: "#76f5e1",
} as const;

export const GROUND = {
  dark: "#080c0d",
} as const;

export const INK = {
  dark: "#f5f7f7",
} as const;

export function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
