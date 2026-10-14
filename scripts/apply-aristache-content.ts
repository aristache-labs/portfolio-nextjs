import { mkdirSync, writeFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { db } from "../src/db/client";
import { experiences, faqs, profile, services, skills, testimonials } from "../src/db/schema";

const SERVICE_UPDATES: Record<
  string,
  { title: string; shortDescription: string; description: string; order: number }
> = {
  "Mobile App Development": {
    title: "Mobile Solutions",
    shortDescription: "Cross-platform mobile apps with performance in mind.",
    description: "Mobile apps with React Native and Expo for iOS and Android.",
    order: 1,
  },
  "Web Development": {
    title: "Web Applications",
    shortDescription: "Modern, scalable web apps with great user experiences.",
    description: "Web applications with Next.js and React, built for clarity and everyday use.",
    order: 0,
  },
  "Backend Development": {
    title: "Systems & Infrastructure",
    shortDescription: "Reliable systems, clean architecture, and automation.",
    description:
      "IT systems, Windows support, troubleshooting, and the services an app depends on.",
    order: 2,
  },
  "Product Strategy": {
    title: "Software Support",
    shortDescription: "Windows systems, troubleshooting, and software support.",
    description:
      "Hands-on support for Windows systems, software problems, and the setup around them.",
    order: 5,
  },
  DevOps: {
    title: "Automation & Tools",
    shortDescription: "Custom tools and workflows that save time and scale.",
    description: "Scripts and small tools, including PowerShell, that remove repetitive work.",
    order: 3,
  },
  "Database Management": {
    title: "Cloud Services",
    shortDescription: "Firebase, Supabase, APIs, and cloud services.",
    description: "Apps connected to Firebase, Supabase, APIs, and cloud services.",
    order: 4,
  },
};

const NEXT_SKILLS: { name: string; iconPath: string; category: string }[] = [
  { name: "JavaScript", iconPath: "/skills/brand/javascript.svg", category: "Languages" },
  { name: "TypeScript", iconPath: "/skills/brand/typescript.svg", category: "Languages" },
  { name: "Dart", iconPath: "/skills/brand/dart.svg", category: "Languages" },
  { name: "Python", iconPath: "/skills/brand/python.svg", category: "Languages" },
  { name: "HTML", iconPath: "/skills/brand/html.svg", category: "Languages" },
  { name: "CSS", iconPath: "/skills/brand/css.svg", category: "Languages" },
  { name: "PHP", iconPath: "/skills/brand/php.svg", category: "Languages" },
  { name: "React", iconPath: "/skills/brand/react.svg", category: "Frameworks" },
  { name: "React Native", iconPath: "/skills/brand/react-native.svg", category: "Frameworks" },
  { name: "Expo", iconPath: "/skills/brand/expo.svg", category: "Frameworks" },
  { name: "Flutter", iconPath: "/skills/brand/flutter.svg", category: "Frameworks" },
  { name: "Next.js", iconPath: "/skills/brand/nextjs.svg", category: "Frameworks" },
  { name: "Node.js", iconPath: "/skills/brand/nodejs.svg", category: "Frameworks" },
  { name: "Tailwind", iconPath: "/skills/brand/tailwind.svg", category: "Frameworks" },
  { name: "MySQL", iconPath: "/skills/brand/mysql.svg", category: "Data" },
  { name: "PostgreSQL", iconPath: "/skills/brand/postgresql.svg", category: "Data" },
  { name: "Supabase", iconPath: "/skills/brand/supabase.svg", category: "Data" },
  { name: "Firebase", iconPath: "/skills/brand/firebase.svg", category: "Data" },
  { name: "Docker", iconPath: "/skills/brand/docker.svg", category: "Systems" },
  { name: "Nginx", iconPath: "/skills/brand/nginx.svg", category: "Systems" },
  { name: "AWS", iconPath: "/skills/brand/aws.svg", category: "Systems" },
  { name: "Azure", iconPath: "/skills/brand/azure.svg", category: "Systems" },  
  { name: "Cloudflare", iconPath: "/skills/brand/cloudflare.svg", category: "Systems" },
  { name: "Windows", iconPath: "/skills/brand/windows.svg", category: "Systems" },
  { name: "Linux", iconPath: "/skills/brand/linux.svg", category: "Systems" },
  { name: "Git", iconPath: "/skills/brand/git.svg", category: "Systems" },
  { name: "GitHub", iconPath: "/skills/brand/github.svg", category: "Systems" },
  { name: "Bitbucket", iconPath: "/skills/brand/bitbucket.svg", category: "Systems" },
  { name: "PowerShell", iconPath: "/skills/brand/powershell.svg", category: "Systems" },
  { name: "Bash", iconPath: "/skills/brand/bash.svg", category: "Systems" },
  { name: "Ansible", iconPath: "/skills/brand/ansible.svg", category: "Systems" },
  { name: "AiScript", iconPath: "/skills/brand/aiscript.svg", category: "Systems" },
];

async function main() {
  const snapshot = {
    profile: await db.select().from(profile),
    experiences: await db.select().from(experiences),
    services: await db.select().from(services),
    skills: await db.select().from(skills),
    faqs: await db.select().from(faqs),
    testimonials: await db
      .select({ id: testimonials.id, name: testimonials.name, email: testimonials.email })
      .from(testimonials),
  };

  mkdirSync("scripts/backups", { recursive: true });
  const backupPath = "scripts/backups/content-2026-10-14.local.json";
  writeFileSync(backupPath, JSON.stringify(snapshot, null, 2));
  console.log(`Backup written (${snapshot.profile.length} profile rows).`);

  const row = snapshot.profile[0];
  if (!row) {
    console.log("No profile row. Nothing to update.");
    return;
  }

  const testimonialsAreDemo =
    snapshot.testimonials.length > 0 &&
    snapshot.testimonials.every((item) => item.email?.endsWith("@example.com"));

  const visibility = { ...(row.sectionVisibility ?? {}) };
  delete visibility.experience;
  if (testimonialsAreDemo) visibility.testimonials = false;

  await db
    .update(profile)
    .set({ sectionVisibility: visibility, updatedAt: new Date() })
    .where(eq(profile.id, row.id));

  let servicesUpdated = 0;
  for (const service of snapshot.services) {
    const next = SERVICE_UPDATES[service.title];
    if (!next) continue;
    await db
      .update(services)
      .set({
        title: next.title,
        shortDescription: next.shortDescription,
        description: next.description,
        order: next.order,
      })
      .where(eq(services.id, service.id));
    servicesUpdated += 1;
  }

  const skillNames = new Set(snapshot.skills.map((item) => item.name));
  const skillsAreTemplate = ["Ruby", "Flutter", "GetX"].every((name) => skillNames.has(name));
  const skillsAreShortList = skillNames.has("Expo") && !skillNames.has("Python");
  const skillsReplaced = skillsAreTemplate || skillsAreShortList;
  if (skillsReplaced) {
    await db.delete(skills);
    await db.insert(skills).values(
      NEXT_SKILLS.map((skill, index) => ({
        name: skill.name,
        iconPath: skill.iconPath,
        category: skill.category,
        level: null,
        order: index,
      })),
    );
  }

  console.log(
    JSON.stringify({
      experienceVisible: visibility.experience !== false,
      testimonialsHidden: testimonialsAreDemo,
      servicesUpdated,
      skillsReplaced,
    }),
  );
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Content update failed");
    process.exit(1);
  });
