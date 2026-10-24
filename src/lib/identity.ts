const name = "Adrian Cristache";
const roles = ["Technical Team Lead", "Automation Engineer", "Builds web & mobile apps"] as const;

export const IDENTITY = {
  name,
  roles,
  jobTitle: roles.slice(0, 2).join(" · "),
  positioning: roles.join(" · "),
} as const;
