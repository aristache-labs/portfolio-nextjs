import { z } from "zod";
import { CONTACT_SUBJECTS } from "./contact-subjects";

export { CONTACT_SUBJECTS };

// The production CSP has no `unsafe-eval`. Zod's JIT probes `new Function` first, which the
// browser reports as a blocked script in the console; skip the probe and parse without JIT.
z.config({ jitless: true });

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
