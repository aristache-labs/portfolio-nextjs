const name = "Adrian Cristache";
const roles = ["IT Specialist", "Web & Mobile Developer"] as const;
const deploymentLocations = "1,600+";

export const IDENTITY = {
  name,
  roles,
  jobTitle: roles.slice(0, 2).join(" · "),
  positioning: roles.join(" · "),
  deploymentLocations,
  manualWorkReduction: "60%",
  teamSize: "5",
  experienceYears: "8+",
  headline: "IT expertise. Web & mobile development.",
  summary:
    "My experience spans enterprise IT, PowerShell automation and script security. In my spare time, I build web and mobile applications.",
} as const;
