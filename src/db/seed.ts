import { db } from "./client";
import {
  profile,
  projects,
  experiences,
  skills,
  services,
  socialLinks,
  fundingLinks,
  taglines,
  faqs,
  testimonials,
} from "./schema";
import { requireEnv } from "@/lib/env";

// Inserted only on a fresh (empty) database. Later content changes are made in the admin
// panel, not by re-running the seed.

const taglineRows = [
  { text: "Rise above limits", active: true, order: 0 },
  { text: "Think, build, and ship", active: true, order: 1 },
];

// avatarUrl is validated as a full http(s) URL, so seed it as an absolute URL
// pointing at the bundled asset on whatever site this database serves.
// NEXT_PUBLIC_SITE_URL is always set (no fallback) — fail loudly if it isn't.
const SITE_ORIGIN = requireEnv("NEXT_PUBLIC_SITE_URL").replace(/\/$/, "");
const seededAvatarUrl = `${SITE_ORIGIN}/images/aristache.png`;

const profileRow = {
  name: "Cristache Adrian",
  bio: "Cristache Adrian is an IT technician focused on Windows systems, troubleshooting, and software support. He builds mobile apps with React Native and Expo, and web apps with Next.js and React, using Firebase, Supabase, APIs, and cloud services.\n\nHe is interested in automation, scripting, infrastructure, and developer tooling, and treats debugging like detective work.",
  stats: { years: 4, repos: 6, stars: 0, followers: 0 },
  roles: ["IT Technician", "Mobile Developer", "Web Developer"],
  // Resume URL lives in the DB only — set it via the admin panel.
  resumeUrl: null,
  avatarUrl: seededAvatarUrl,
  heroTagline: "Diagnose. Build. Automate.",
  sectionVisibility: { testimonials: false },
};

const featuredSet = new Set(["fitpro-center"]);
// Array position IS the `order` (see the .map() below) and order doubles as the showcase
// ranking, so this sequence is the order they lead with. Language tags are omitted where
// GitHub reports the language: it renders as its own chip and mergeProjects strips duplicates.
const projectRows: (typeof projects.$inferInsert)[] = [
  { repo: "fitpro-center", title: "FitPro Center", tags: ["Fitness", "Web"] },
  { repo: "aristache-labs", title: "aristache-labs", tags: ["Profile"] },
  {
    repo: "MoneyPrinterTurbo-Extended",
    title: "MoneyPrinterTurbo Extended",
    tags: ["Video", "Automation"],
  },
  {
    repo: "VUZA-Free-AI-Video-Creator-and-Pinterest-Video-Scraper",
    title: "VUZA",
    tags: ["Video", "Voiceover"],
  },
  { repo: "MoneyPrinterTurbo", title: "MoneyPrinterTurbo", tags: ["Video", "Automation"] },
  { repo: "ViralCutter", title: "ViralCutter", tags: ["Video", "Clips"] },
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
    category: "Languages",
    items: [
      { name: "JavaScript", level: null, iconPath: "/skills/brand/javascript.svg" },
      { name: "TypeScript", level: null, iconPath: "/skills/brand/typescript.svg" },
      { name: "Dart", level: null, iconPath: "/skills/brand/dart.svg" },
      { name: "Python", level: null, iconPath: "/skills/brand/python.svg" },
      { name: "HTML", level: null, iconPath: "/skills/brand/html.svg" },
      { name: "CSS", level: null, iconPath: "/skills/brand/css.svg" },
      { name: "PHP", level: null, iconPath: "/skills/brand/php.svg" },
    ],
  },
  {
    category: "Frameworks",
    items: [
      { name: "React", level: null, iconPath: "/skills/brand/react.svg" },
      { name: "React Native", level: null, iconPath: "/skills/brand/react-native.svg" },
      { name: "Expo", level: null, iconPath: "/skills/brand/expo.svg" },
      { name: "Flutter", level: null, iconPath: "/skills/brand/flutter.svg" },
      { name: "Next.js", level: null, iconPath: "/skills/brand/nextjs.svg" },
      { name: "Node.js", level: null, iconPath: "/skills/brand/nodejs.svg" },
      { name: "Tailwind", level: null, iconPath: "/skills/brand/tailwind.svg" },
    ],
  },
  {
    category: "Data",
    items: [
      { name: "MySQL", level: null, iconPath: "/skills/brand/mysql.svg" },
      { name: "PostgreSQL", level: null, iconPath: "/skills/brand/postgresql.svg" },
      { name: "Supabase", level: null, iconPath: "/skills/brand/supabase.svg" },
      { name: "Firebase", level: null, iconPath: "/skills/brand/firebase.svg" },
    ],
  },
  {
    category: "Systems",
    items: [
      { name: "Docker", level: null, iconPath: "/skills/brand/docker.svg" },
      { name: "Nginx", level: null, iconPath: "/skills/brand/nginx.svg" },
      { name: "AWS", level: null, iconPath: "/skills/brand/aws.svg" },
      { name: "Azure", level: null, iconPath: "/skills/brand/azure.svg" },
      { name: "Cloudflare", level: null, iconPath: "/skills/brand/cloudflare.svg" },
      { name: "Windows", level: null, iconPath: "/skills/brand/windows.svg" },
      { name: "Linux", level: null, iconPath: "/skills/brand/linux.svg" },
      { name: "Git", level: null, iconPath: "/skills/brand/git.svg" },
      { name: "GitHub", level: null, iconPath: "/skills/brand/github.svg" },
      { name: "Bitbucket", level: null, iconPath: "/skills/brand/bitbucket.svg" },
      { name: "PowerShell", level: null, iconPath: "/skills/brand/powershell.svg" },
      { name: "Bash", level: null, iconPath: "/skills/brand/bash.svg" },
      { name: "Ansible", level: null, iconPath: "/skills/brand/ansible.svg" },
      { name: "AiScript", level: null, iconPath: "/skills/brand/aiscript.svg" },
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
    shortDescription: "Modern, scalable web apps with great user experiences.",
    description: "Web applications with Next.js and React, built for clarity and everyday use.",
    order: 0,
  },
  {
    title: "Mobile Solutions",
    shortDescription: "Cross-platform mobile apps with performance in mind.",
    description: "Mobile apps with React Native and Expo for iOS and Android.",
    order: 1,
  },
  {
    title: "Systems & Infrastructure",
    shortDescription: "Reliable systems, clean architecture, and automation.",
    description:
      "IT systems, Windows support, troubleshooting, and the services an app depends on.",
    order: 2,
  },
  {
    title: "Automation & Tools",
    shortDescription: "Custom tools and workflows that save time and scale.",
    description: "Scripts and small tools, including PowerShell, that remove repetitive work.",
    order: 3,
  },
  {
    title: "Cloud Services",
    shortDescription: "Firebase, Supabase, APIs, and cloud services.",
    description: "Apps connected to Firebase, Supabase, APIs, and cloud services.",
    order: 4,
  },
  {
    title: "Software Support",
    shortDescription: "Windows systems, troubleshooting, and software support.",
    description:
      "Hands-on support for Windows systems, software problems, and the setup around them.",
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

const faqRows = [
  {
    question: "Who is Cristache Adrian?",
    answer:
      "Cristache Adrian is an IT technician and developer. He focuses on Windows systems, troubleshooting, and software support, and builds mobile and web applications.",
    order: 0,
  },
  {
    question: "What does Adrian build?",
    answer:
      "He builds mobile apps with React Native and Expo, and web apps with Next.js and React, using Firebase, Supabase, APIs, and cloud services.",
    order: 1,
  },
  {
    question: "What is Adrian's tech stack?",
    answer:
      "React Native, Expo, Next.js, React, Firebase, Supabase, Windows, Azure, and PowerShell.",
    order: 2,
  },
  {
    question: "Is Adrian available for collaboration?",
    answer:
      "Yes. Adrian is open to conversations about interesting projects. The fastest way to reach him is through the contact section on this site.",
    order: 3,
  },
  {
    question: "How can I contact Adrian?",
    answer:
      "Use the contact section on this site, or reach him on GitHub at github.com/aristache-labs.",
    order: 4,
  },
];

// Demo testimonials covering every case (pending/approved/rejected, featured,
// complete vs sparse details, a duplicate email). Seeded ONLY into an empty
// testimonials table so real user submissions are never wiped.
const testimonialRows: (typeof testimonials.$inferInsert)[] = [
  {
    name: "Aarav Mehta",
    email: "aarav.mehta@example.com",
    relationship: "College friend & hackathon teammate",
    content:
      "Adrian is the most driven person I studied with. We built our first hackathon project together and he carried the team - clean architecture, calm under pressure, and genuinely fun to work with.",
    status: "approved",
    featured: true,
    order: 0,
    linkedinUrl: "https://www.linkedin.com/in/aaravmehta",
    githubUrl: "https://github.com/aaravmehta",
    websiteUrl: "https://aarav.dev",
  },
  {
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    relationship: "Engineering Manager at Merito",
    content:
      "I managed Adrian for over a year. He consistently shipped polished features ahead of schedule and raised the quality bar for the whole team. A rare mix of speed and craft.",
    status: "approved",
    featured: true,
    order: 1,
    linkedinUrl: "https://www.linkedin.com/in/priyasharma",
  },
  {
    name: "Rahul Verma",
    email: "rahul.verma@example.com",
    relationship: "Open-source collaborator",
    content:
      "We maintain a Flutter package together. Adrian's reviews are thorough and kind, and his docs are the reason new contributors actually stick around.",
    status: "approved",
    featured: false,
    order: 2,
    githubUrl: "https://github.com/rahulverma",
    xUrl: "https://x.com/rahulverma",
  },
  {
    name: "Dr. Anjali Rao",
    email: "anjali.rao@example.com",
    relationship: "Professor, Computer Science",
    content:
      "Adrian was among the most curious students I taught. He asked the questions the rest of the class was afraid to, and he always followed through with working code.",
    status: "approved",
    featured: false,
    order: 3,
  },
  {
    name: "Sofia Almeida",
    email: "sofia.almeida@example.com",
    relationship: "Product designer, freelance project",
    content:
      "Handing designs to Adrian felt effortless. He respected the details, asked the right questions, and the final build looked better than the mockups.",
    status: "pending",
    featured: false,
    order: 4,
    instagramUrl: "https://instagram.com/sofia.designs",
    websiteUrl: "https://sofiaalmeida.design",
  },
  {
    name: "Karan Singh",
    email: "karan.singh@example.com",
    relationship: "Former teammate",
    content: "Dependable, sharp, and a great teammate. Would work with him again in a heartbeat.",
    status: "pending",
    featured: false,
    order: 5,
  },
  {
    // Duplicate email of Aarav above — exercises the admin duplicate flag.
    name: "Aarav Mehta",
    email: "aarav.mehta@example.com",
    relationship: "College friend",
    content:
      "Adding a second note because I forgot to mention - he also mentored three juniors on our team and they all credit him for their growth.",
    status: "pending",
    featured: false,
    order: 6,
  },
  {
    name: "Spammy McSpamface",
    email: "spam@example.com",
    relationship: "n/a",
    content:
      "Check out my amazing crypto deals at this totally legit link, definitely not spam at all friend.",
    status: "rejected",
    featured: false,
    order: 7,
  },
];

// Everything the seed writes, inserted only on a fresh (empty) database.
const SEED_DATA = {
  taglines: taglineRows,
  profile: profileRow,
  projects: projectRows,
  experiences: experienceRows,
  skills: skillRows,
  services: serviceRows,
  socialLinks: socialLinkRows,
  fundingLinks: fundingLinkRows,
  faqs: faqRows,
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
    await tx.insert(taglines).values(SEED_DATA.taglines);
    await tx.insert(profile).values(SEED_DATA.profile);
    await tx.insert(projects).values(SEED_DATA.projects);
    await tx.insert(experiences).values(SEED_DATA.experiences);
    await tx.insert(skills).values(SEED_DATA.skills);
    await tx.insert(services).values(SEED_DATA.services);
    await tx.insert(socialLinks).values(SEED_DATA.socialLinks);
    if (SEED_DATA.fundingLinks.length > 0) {
      await tx.insert(fundingLinks).values(SEED_DATA.fundingLinks);
    }
    await tx.insert(faqs).values(SEED_DATA.faqs);
  });

  console.log("Seed complete.");
}

/**
 * Seed demo testimonials for LOCAL UI testing only. These are fabricated, so
 * they must never reach production — skipped when NODE_ENV is "production".
 * Seeds only when the table is empty so real submissions are never wiped.
 */
async function seedDemoTestimonials() {
  if (process.env.NODE_ENV === "production") {
    console.log("Production environment; skipping demo testimonials.");
    return;
  }
  const existing = await db.select({ id: testimonials.id }).from(testimonials).limit(1);
  if (existing.length > 0) {
    console.log("Testimonials already present; skipping demo seed.");
    return;
  }
  await db.insert(testimonials).values(testimonialRows);
  console.log(`Seeded ${testimonialRows.length} demo testimonials (local only).`);
}

seed()
  .then(() => seedDemoTestimonials())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
