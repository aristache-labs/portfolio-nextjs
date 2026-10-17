import { mkdirSync, writeFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { db } from "../src/db/client";
import { experiences, profile, services, skills } from "../src/db/schema";

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
  { name: "JavaScript", iconPath: "/skills/javascript.svg", category: "Development" },
  { name: "TypeScript", iconPath: "/skills/typescript.svg", category: "Development" },
  { name: "Dart", iconPath: "/skills/dart.svg", category: "Development" },
  { name: "Python", iconPath: "/skills/python.svg", category: "Development" },
  { name: "HTML", iconPath: "/skills/html.svg", category: "Development" },
  { name: "CSS", iconPath: "/skills/css.svg", category: "Development" },
  { name: "PHP", iconPath: "/skills/php.svg", category: "Development" },
  { name: "React", iconPath: "/skills/react.svg", category: "Development" },
  { name: "React Native", iconPath: "/skills/react-native.svg", category: "Development" },
  { name: "Expo", iconPath: "/skills/expo.svg", category: "Development" },
  { name: "Flutter", iconPath: "/skills/flutter.svg", category: "Development" },
  { name: "Next.js", iconPath: "/skills/nextjs.svg", category: "Development" },
  { name: "Node.js", iconPath: "/skills/nodejs.svg", category: "Development" },
  { name: "Tailwind", iconPath: "/skills/tailwind.svg", category: "Development" },
  { name: "Docker", iconPath: "/skills/docker.svg", category: "Infrastructure" },
  { name: "Nginx", iconPath: "/skills/nginx.svg", category: "Infrastructure" },
  { name: "Windows", iconPath: "/skills/windows.svg", category: "Infrastructure" },
  { name: "Linux", iconPath: "/skills/linux.svg", category: "Infrastructure" },
  { name: "Git", iconPath: "/skills/git.svg", category: "Infrastructure" },
  { name: "GitHub", iconPath: "/skills/github.svg", category: "Infrastructure" },
  { name: "Bitbucket", iconPath: "/skills/bitbucket.svg", category: "Infrastructure" },
  { name: "PowerShell", iconPath: "/skills/powershell.svg", category: "Automation" },
  { name: "Bash", iconPath: "/skills/bash.svg", category: "Automation" },
  { name: "Ansible", iconPath: "/skills/ansible.svg", category: "Automation" },
  { name: "AiScript", iconPath: "/skills/aiscript.svg", category: "Automation" },
  { name: "MySQL", iconPath: "/skills/mysql.svg", category: "Data & Cloud" },
  { name: "PostgreSQL", iconPath: "/skills/postgresql.svg", category: "Data & Cloud" },
  { name: "Supabase", iconPath: "/skills/supabase.svg", category: "Data & Cloud" },
  { name: "Firebase", iconPath: "/skills/firebase.svg", category: "Data & Cloud" },
  { name: "AWS", iconPath: "/skills/aws.svg", category: "Data & Cloud" },
  { name: "Azure", iconPath: "/skills/azure.svg", category: "Data & Cloud" },
  { name: "Cloudflare", iconPath: "/skills/cloudflare.svg", category: "Data & Cloud" },
];

async function main() {
  const snapshot = {
    profile: await db.select().from(profile),
    experiences: await db.select().from(experiences),
    services: await db.select().from(services),
    skills: await db.select().from(skills),
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

  const visibility = { ...(row.sectionVisibility ?? {}) };
  delete visibility.experience;

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
