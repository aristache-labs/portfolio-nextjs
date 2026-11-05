const name = "Adrian Cristache";
const roles = ["IT Specialist", "Web & Mobile Developer"] as const;
const deploymentLocations = "1,600+";

/** Hero copy used until the admin saves their own in Profile. */
export const HERO_DEFAULTS = {
  headline: "Infrastructure meets innovation.",
  summary:
    "My experience spans enterprise IT, PowerShell automation and script security. In my spare time, I build web and mobile applications.",
} as const;

export const IDENTITY = {
  name,
  personAlternateNames: ["Cristache Adrian", "Aristache"],
  siteAlternateNames: ["Aristache"],
  givenName: "Adrian",
  familyName: "Cristache",
  roles,
  jobTitle: roles.slice(0, 2).join(" · "),
  positioning: roles.join(" · "),
  deploymentLocations,
  manualWorkReduction: "60%",
  teamSize: "5",
  experienceYears: "8+",
  headline: "IT expertise. Web & mobile development.",
  summary: HERO_DEFAULTS.summary,
} as const;
