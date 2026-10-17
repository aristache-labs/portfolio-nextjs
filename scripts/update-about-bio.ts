import { db } from "../src/db/client";
import { profile } from "../src/db/schema";

const bio =
  "I'm Adrian, a Technical Team Lead and software developer with over 8 years of experience in IT infrastructure, system administration, and automation. I lead enterprise deployments, build reliable systems, and turn complex technical challenges into practical solutions.\n\nBeyond infrastructure, I create modern web and mobile applications, combining engineering, creativity, and a constant drive to learn and improve.";

const updated = await db.update(profile).set({ bio }).returning({ id: profile.id });
console.log(`updated ${updated.length} profile row(s)`);
process.exit(0);
