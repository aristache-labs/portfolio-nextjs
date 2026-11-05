import { IDENTITY } from "./identity";

/** Stable slots in the existing profile.stats JSON; unrelated statistics stay intact. */
export const ABOUT_STAT_SLOTS = [
  { key: "manualWorkReduction", value: IDENTITY.manualWorkReduction, label: "Less manual work" },
  { key: "deploymentLocations", value: IDENTITY.deploymentLocations, label: "Locations upgraded" },
  { key: "teamSize", value: IDENTITY.teamSize, label: "Team members led" },
  { key: "experienceYears", value: IDENTITY.experienceYears, label: "Years of experience" },
] as const;

export type AboutStat = { key: string; value: string; label: string };
export type ProfileStats = Record<string, string | number>;

/** Legacy profiles keep their current cards until the owner saves the editor. */
export function getAboutStats(stats: ProfileStats): AboutStat[] {
  return ABOUT_STAT_SLOTS.map((slot) => ({
    key: slot.key,
    value: String(stats[slot.key] ?? slot.value),
    label: String(stats[`${slot.key}Label`] ?? slot.label),
  })).filter(({ value, label }) => value.trim() && label.trim());
}

export function aboutStatsFromForm(form: FormData): ProfileStats {
  return Object.fromEntries(
    ABOUT_STAT_SLOTS.flatMap(({ key }) =>
      [key, `${key}Label`].map((name) => [name, String(form.get(name) ?? "").trim()]),
    ),
  );
}
