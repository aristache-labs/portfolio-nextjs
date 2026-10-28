import { db } from "./client";
import { IDENTITY } from "@/lib/identity";
import {
  profile,
  projects,
  experiences,
  skills,
  services,
  socialLinks,
  fundingLinks,
} from "./schema";
// Inserted only on a fresh (empty) database. Later content changes are made in the admin
// panel, not by re-running the seed.

// Root-relative so next/image serves the bundled file. An absolute URL on the
// production host is refused unless that host is listed in images.remotePatterns.
const seededAvatarUrl = "/images/aristache.webp";

const profileRow = {
  name: IDENTITY.name,
  bio: "I'm Adrian, an IT specialist and web and mobile developer with over 8 years of experience in IT infrastructure, system administration, and automation. My experience includes leading enterprise deployments, building reliable systems, and turning complex technical challenges into practical solutions.\n\nMy experience spans enterprise IT, PowerShell automation and script security. In my spare time, I build web and mobile applications.",
  stats: { years: 8, repos: 6, stars: 0, followers: 0 },
  roles: [...IDENTITY.roles],
  // Resume URL lives in the DB only — set it via the admin panel.
  resumeUrl: null,
  avatarUrl: seededAvatarUrl,
  heroTagline: "Diagnose. Build. Automate.",
};

const featuredSet = new Set(["portfolio-nextjs", "fitpro-center", "ViralCutter"]);
// Array position IS the `order` (see the .map() below) and order doubles as the showcase
// ranking, so this sequence is the order they lead with. Most repos are private, so GitHub
// reports no language or description for them: the blurb and the stack tags carry that here.
const projectRows: (typeof projects.$inferInsert)[] = [
  {
    repo: "portfolio-nextjs",
    title: "Aristache Portfolio",
    coverImage: "/media/hero.webp",
    customBlurb:
      "This site: a database-driven portfolio with an admin area, built on Next.js and React 19.",
    tags: ["Next.js", "React 19", "TypeScript"],
  },
  {
    repo: "fitpro-center",
    title: "FitPro Center",
    coverImage: "/brand/fitpro-center-poster.webp",
    customBlurb: "Marketing website for FitPro Center, a premium fitness brand.",
    tags: ["Next.js", "React 18", "Tailwind CSS"],
  },
  {
    repo: "ViralCutter",
    title: "ViralCutter",
    coverImage: "/brand/viralcutter-poster.webp",
    customBlurb: "AI tool that turns long videos into viral short clips.",
    tags: ["Python", "JavaScript", "CSS"],
  },
  {
    repo: "VUZA-Free-AI-Video-Creator-and-Pinterest-Video-Scraper",
    title: "VUZA",
    customBlurb: "Free AI video creator with voiceover, subtitles, and a Pinterest video scraper.",
    tags: ["Python", "AI Video"],
  },
  {
    repo: "MiVue-Pro",
    title: "MiVue Pro",
    coverImage: "/brand/mivudelaneroy-poster.webp",
    customBlurb: "Dashcam website and mobile app for browsing and managing dashcam footage.",
    tags: ["React Native", "Expo", "TypeScript"],
  },
  {
    repo: "mitugym-app",
    title: "MITUGYM App",
    coverImage: "/brand/mitugym-app-poster.webp",
    customBlurb: "Production gym management mobile app with check-in, built on Supabase.",
    tags: ["React Native", "Expo", "Supabase"],
  },
  {
    repo: "mitugym-app-webpanel",
    title: "MITUGYM Web Panel",
    coverImage: "/brand/mitugym-web-panel-poster.webp",
    customBlurb: "Staff dashboard for the MITUGYM ecosystem, with auth, persistence, and actions.",
    tags: ["Next.js 16", "React 19", "Tailwind v4", "Supabase"],
  },
  {
    repo: "mitugym_scanner_flutter",
    title: "MITUGYM Scanner",
    coverImage: "/brand/mitugym-checkin-scanner-poster.webp",
    customBlurb: "Windows desktop QR scanner for gym member check-in and check-out.",
    tags: ["Flutter", "Dart", "SQLite"],
  },
  {
    repo: "MindMuscle.AI",
    title: "MindMuscle.AI",
    coverImage: "/brand/mindmuscle-ai-app-poster.webp",
    customBlurb: "AI-powered fitness coaching and progress tracking, with Sentry monitoring.",
    tags: ["React Native", "Expo", "Supabase"],
  },
  {
    repo: "MindMuscleWeb",
    title: "MindMuscle Web",
    coverImage: "/brand/mindmuscle-ai-web-poster.webp",
    customBlurb: "Web app for AI-powered fitness coaching and progress.",
    tags: ["Next.js", "TypeScript", "Jest", "Tailwind CSS"],
  },
  {
    repo: "auto-translate",
    title: "Auto Translate",
    coverImage: "/brand/auto-translate-poster.webp",
    customBlurb: "Real-time speech translation desktop app built with Tauri.",
    tags: ["Tauri 2", "Rust", "Python", "TypeScript"],
  },
  {
    repo: "car-detailing",
    title: "Car Detailing",
    coverImage: "/brand/car-detailing-poster.webp",
    customBlurb: "Premium car detailing landing page with a luxury carbon and gold UI.",
    tags: ["Next.js", "TypeScript"],
  },
  {
    repo: "personal-trainer",
    title: "Personal Trainer",
    coverImage: "/brand/personal-trainer-poster.webp",
    customBlurb: "Modern, production-ready personal trainer website.",
    tags: ["Next.js", "TypeScript", "Tailwind CSS"],
  },
].map((p, i) => ({
  ...p,
  featured: featuredSet.has(p.repo),
  order: i,
  hidden: false,
}));

const experienceRows = [
  {
    role: "Software Development Engineer",
    org: "StarApps Studio",
    period: "Jul 2024 – Present",
    location: "Pune, India",
    isCurrent: true,
    description: [
      "Currently working on developing innovative software solutions.",
      "Contributing to large-scale projects with a focus on performance optimization.",
      "Collaborating closely with cross-functional teams to ensure product quality.",
      "Adhering to clean code practices and modern development techniques.",
    ],
    order: 0,
  },
  {
    role: "Full Stack Developer",
    org: "Merito",
    period: "Feb 2023 – Jul 2024",
    location: "Pune, India",
    isCurrent: false,
    description: [
      "Developed over 5 web applications with seamless backend API integration.",
      "Streamlined workflows by eliminating redundant data, boosting efficiency.",
      "Improved website loading time by 80% through image optimization, minimizing main-thread work, and implementing SEO strategies.",
      "Resolved 100+ bugs and conducted thorough code reviews.",
      "Demonstrated expertise in both backend and frontend development.",
    ],
    order: 1,
  },
  {
    role: "Full Stack Development Intern",
    org: "TECHOX LLP",
    period: "May 2021 – Jul 2022",
    location: "Remote",
    isCurrent: false,
    description: [
      "Revamped and enhanced 3+ mobile apps using Flutter.",
      "Deployed RESTful APIs for seamless app-server integration.",
      "Integrated Google AdMob to effectively monetize applications.",
      "Contributed to boosting app functionality and revenue generation.",
    ],
    order: 2,
  },
  {
    role: "Web Development Intern",
    org: "Career Corner Education Pvt Ltd",
    period: "Jul 2021 – Nov 2021",
    location: "Remote",
    isCurrent: false,
    description: [
      "Spearheaded website development and enhancements for company portals.",
      "Prioritized clean, reusable code with modern tech stacks.",
      "Efficiently managed multiple tasks with minimal supervision.",
      "Collaborated with senior team members to meet and exceed project goals.",
    ],
    order: 3,
  },
];

// Skills are authored grouped by category, then flattened to rows with a
// running order so the Skills section renders them grouped and in sequence.
const skillGroups: {
  category: string;
  items: { name: string; level: string | null; iconPath: string }[];
}[] = [
  {
    category: "Development",
    items: [
      { name: "JavaScript", level: "90", iconPath: "/skills/javascript.svg" },
      { name: "TypeScript", level: "85", iconPath: "/skills/typescript.svg" },
      { name: "Dart", level: "75", iconPath: "/skills/dart.svg" },
      { name: "Python", level: "80", iconPath: "/skills/python.svg" },
      { name: "HTML", level: "90", iconPath: "/skills/html.svg" },
      { name: "CSS", level: "85", iconPath: "/skills/css.svg" },
      { name: "PHP", level: "60", iconPath: "/skills/php.svg" },
      { name: "React", level: "90", iconPath: "/skills/react.svg" },
      { name: "React Native", level: "85", iconPath: "/skills/react-native.svg" },
      { name: "Expo", level: "80", iconPath: "/skills/expo.svg" },
      { name: "Flutter", level: "70", iconPath: "/skills/flutter.svg" },
      { name: "Next.js", level: "90", iconPath: "/skills/nextjs.svg" },
      { name: "Node.js", level: "85", iconPath: "/skills/nodejs.svg" },
      { name: "Tailwind", level: "90", iconPath: "/skills/tailwind.svg" },
    ],
  },
  {
    category: "Infrastructure",
    items: [
      { name: "Docker", level: "75", iconPath: "/skills/docker.svg" },
      { name: "Nginx", level: "70", iconPath: "/skills/nginx.svg" },
      { name: "Windows", level: "90", iconPath: "/skills/windows.svg" },
      { name: "Linux", level: "85", iconPath: "/skills/linux.svg" },
      { name: "Git", level: "95", iconPath: "/skills/git.svg" },
      { name: "GitHub", level: "90", iconPath: "/skills/github.svg" },
      { name: "Bitbucket", level: "70", iconPath: "/skills/bitbucket.svg" },
    ],
  },
  {
    category: "Automation",
    items: [
      { name: "PowerShell", level: "85", iconPath: "/skills/powershell.svg" },
      { name: "Bash", level: "80", iconPath: "/skills/bash.svg" },
      { name: "Ansible", level: "65", iconPath: "/skills/ansible.svg" },
      { name: "AiScript", level: "70", iconPath: "/skills/aiscript.svg" },
    ],
  },
  {
    category: "Data & Cloud",
    items: [
      { name: "MySQL", level: "75", iconPath: "/skills/mysql.svg" },
      { name: "PostgreSQL", level: "80", iconPath: "/skills/postgresql.svg" },
      { name: "Supabase", level: "85", iconPath: "/skills/supabase.svg" },
      { name: "Firebase", level: "75", iconPath: "/skills/firebase.svg" },
      { name: "AWS", level: "70", iconPath: "/skills/aws.svg" },
      { name: "Azure", level: "65", iconPath: "/skills/azure.svg" },
      { name: "Cloudflare", level: "75", iconPath: "/skills/cloudflare.svg" },
    ],
  },
];
const skillRows = skillGroups.flatMap((g, gi) =>
  g.items.map((it, ii) => ({
    name: it.name,
    iconPath: it.iconPath,
    category: g.category,
    level: it.level,
    // category index * 100 + item index keeps groups contiguous and ordered.
    order: gi * 100 + ii,
  })),
);

const serviceRows = [
  {
    title: "Web Applications",
    shortDescription: "Fast. Responsive. Scalable.",
    description:
      "Responsive websites, dashboards, and modern web applications built with React and Next.js, integrating APIs and backend services.",
    order: 0,
  },
  {
    title: "Mobile Solutions",
    shortDescription: "One codebase. Two platforms.",
    description:
      "Cross-platform iOS and Android applications using React Native and Expo, with intuitive user experiences and seamless backend integration.",
    order: 1,
  },
  {
    title: "Systems & Infrastructure",
    shortDescription: "Stability. Security. Reliability.",
    description:
      "Windows Server and Linux administration, virtualization, infrastructure maintenance, and security-focused system operations.",
    order: 2,
  },
  {
    title: "Automation & Tools",
    shortDescription: "Less manual work. More efficiency.",
    description:
      "PowerShell scripting, Ansible automation, and enterprise deployment workflows that simplify complex operations and eliminate repetitive tasks.",
    order: 3,
  },
  {
    title: "Cloud & Integrations",
    shortDescription: "Connected systems. Seamless workflows.",
    description:
      "Connecting applications with Firebase, Supabase, databases, APIs, and cloud platforms to enable reliable data and service integrations.",
    order: 4,
  },
  {
    title: "IT Support & Troubleshooting",
    shortDescription: "Diagnose. Resolve. Optimize.",
    description:
      "Technical diagnosis, incident resolution, Level 2 support, and system optimization across Windows and enterprise IT environments.",
    order: 5,
  },
];

const socialLinkRows = [
  {
    platform: "GitHub",
    url: "https://github.com/aristache-labs",
    username: "aristache-labs",
    order: 0,
  },
];

const fundingLinkRows: (typeof fundingLinks.$inferInsert)[] = [];

// Everything the seed writes, inserted only on a fresh (empty) database.
const SEED_DATA = {
  profile: profileRow,
  projects: projectRows,
  experiences: experienceRows,
  skills: skillRows,
  services: serviceRows,
  socialLinks: socialLinkRows,
  fundingLinks: fundingLinkRows,
};

/**
 * Inserts ONLY when there is no profile row, and never wipes or overwrites, so re-running this
 * against a populated database preserves every admin edit.
 */
async function seed() {
  const [existing] = await db.select({ id: profile.id }).from(profile).limit(1);
  if (existing) {
    console.log("Database already has content; skipping seed.");
    return;
  }

  console.log("Empty database; seeding content tables…");

  await db.transaction(async (tx) => {
    await tx.insert(profile).values(SEED_DATA.profile);
    await tx.insert(projects).values(SEED_DATA.projects);
    await tx.insert(experiences).values(SEED_DATA.experiences);
    await tx.insert(skills).values(SEED_DATA.skills);
    await tx.insert(services).values(SEED_DATA.services);
    await tx.insert(socialLinks).values(SEED_DATA.socialLinks);
    if (SEED_DATA.fundingLinks.length > 0) {
      await tx.insert(fundingLinks).values(SEED_DATA.fundingLinks);
    }
  });

  console.log("Seed complete.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
