import { IDENTITY } from "./identity";

/**
 * The four About result cards. Values and labels are edited in Admin -> Profile and stored in
 * `profile.stats` under `<key>` and `<key>Label`, next to the GitHub-derived numbers that also
 * live there. A missing or empty entry falls back to the default below.
 */
export const ABOUT_STATS = [
  { key: "manualWorkReduction", value: IDENTITY.manualWorkReduction, label: "Less manual work" },
  { key: "deploymentLocations", value: IDENTITY.deploymentLocations, label: "Locations upgraded" },
  { key: "teamSize", value: IDENTITY.teamSize, label: "Team members led" },
  { key: "experienceYears", value: IDENTITY.experienceYears, label: "Years of experience" },
] as const;

export type AboutStatKey = (typeof ABOUT_STATS)[number]["key"];
export type AboutStat = { key: AboutStatKey; value: string; label: string };

function text(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

/** The cards to render, in their fixed order, with admin overrides applied. */
export function aboutStats(stats: Record<string, unknown> | null | undefined): AboutStat[] {
  return ABOUT_STATS.map((stat) => ({
    key: stat.key,
    value: text(stats?.[stat.key]) || stat.value,
    label: text(stats?.[`${stat.key}Label`]) || stat.label,
  }));
}

/**
 * Writes the submitted card fields over the stored stats. Every other key, such as the GitHub
 * counters, is kept. An emptied field is removed, so the card returns to its default.
 */
export function mergeAboutStats(
  stored: Record<string, string | number>,
  read: (name: string) => string,
): Record<string, string | number> {
  const next = { ...stored };
  for (const { key } of ABOUT_STATS) {
    for (const name of [key, `${key}Label`]) {
      const value = read(name).trim();
      if (value) next[name] = value;
      else delete next[name];
    }
  }
  return next;
}
