import { z } from "zod";

/** Single source for the subject menu: the form renders it, the route validates against it. */
export const CONTACT_SUBJECTS = [
  "Project Collaboration",
  "Job Opportunity",
  "Freelance Work",
  "General Question",
] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Add your name.").max(80, "Add your name."),
  email: z
    .string()
    .trim()
    .max(120, "Add a valid email.")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
      message: "Add a valid email.",
    }),
  subject: z.enum(CONTACT_SUBJECTS, { message: "Choose a subject." }),
  message: z
    .string()
    .trim()
    .min(10, "Message should be 10 to 2000 characters.")
    .max(2000, "Message should be 10 to 2000 characters."),
});

export type ContactInput = z.infer<typeof contactSchema>;
