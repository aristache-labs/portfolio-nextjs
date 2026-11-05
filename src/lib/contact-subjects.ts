/** Single source for the subject menu: the form renders it, the route validates against it. Kept zod-free so the client bundle never pulls zod. */
export const CONTACT_SUBJECTS = [
  "Project Collaboration",
  "Job Opportunity",
  "Freelance Work",
  "General Question",
] as const;
