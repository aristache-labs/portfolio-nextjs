import { asc } from "drizzle-orm";

import { db } from "@/db/client";
import { profile, experiences, skills, services, socialLinks, fundingLinks } from "@/db/schema";
import type { Experience, Skill, Service } from "@/db/schema";
import { getProjects } from "@/lib/projects";
import type { MergedProject } from "@/lib/projects";
import { getCachedUserStats } from "@/lib/github-cache";
import { professionalYears } from "@/lib/experience";

// Bundled asset shown when the profile has no avatar set yet (e.g. before the
// admin uploads one). Served from `public/`, so a relative src is correct here.
const FALLBACK_AVATAR = "/images/aristache.webp";

// GitHub account backing the live stats (same owner as the curated repos).
const GITHUB_USERNAME = "aristache-labs";

// ── Public row types ────────────────────────────────────────────────────────

export type ExperienceRow = Experience;
export type SkillRow = Skill;
export type ServiceRow = Service;

export type SocialRow = {
  platform: string;
  url: string;
  username: string;
  order: number;
};

export type FundingRow = {
  label: string;
  url: string;
  primary: boolean;
  order: number;
};

// ── Re-export ────────────────────────────────────────────────────────────────

export type { MergedProject };
export { getProjects as getProjectsMerged };

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Navigation and footer need no GitHub statistics or experience history. */
export async function getNavigationProfile() {
  const [row] = await db
    .select({ email: profile.email, sectionVisibility: profile.sectionVisibility })
    .from(profile)
    .limit(1);
  if (!row) throw new Error("Profile row not found");
  return {
    email: row.email ?? null,
    sectionVisibility: (row.sectionVisibility as Record<string, boolean>) ?? {},
  };
}

export async function getProfile(): Promise<{
  name: string;
  email: string | null;
  bio: string;
  roles: string[];
  avatarUrl: string;
  resumeUrl: string;
  heroTagline: string | null;
  sectionVisibility: Record<string, boolean>;
  stats: { years: number; repos: number; stars: number; followers: number };
}> {
  const rows = await db.select().from(profile);
  const row = rows[0];
  if (!row) throw new Error("Profile row not found");

  const s = row.stats as Record<string, unknown>;

  // Served from the last-known-good cache row so they never flash blank, falling back to the
  // seeded stats only on a cold cache with a failed first fetch.
  const [userStats, periods] = await Promise.all([
    getCachedUserStats(GITHUB_USERNAME),
    db.select({ period: experiences.period }).from(experiences),
  ]);
  const followers = userStats ? userStats.followers : Number(s.followers ?? 0);
  const repos =
    userStats && userStats.publicRepos > 0 ? userStats.publicRepos : Number(s.repos ?? 0);
  const stars = userStats && userStats.totalStars > 0 ? userStats.totalStars : Number(s.stars ?? 0);

  // Years is NOT GitHub-derived: it is professional experience, taken from the experience
  // rows. GitHub's first-contribution year answers a different question (how long the
  // account has existed) and counted hobby years as professional ones.
  const years = professionalYears(periods.map((p) => p.period)) ?? Number(s.years ?? 0);

  return {
    name: row.name,
    email: row.email ?? null,
    bio: row.bio,
    avatarUrl: (row.avatarUrl as string) || FALLBACK_AVATAR,
    resumeUrl: (row.resumeUrl as string) ?? "",
    heroTagline: row.heroTagline ?? null,
    sectionVisibility: (row.sectionVisibility as Record<string, boolean>) ?? {},
    roles: row.roles,
    stats: { years, repos, stars, followers },
  };
}

export async function getExperiences(): Promise<ExperienceRow[]> {
  return db.select().from(experiences).orderBy(asc(experiences.order));
}

export async function getSkills(): Promise<SkillRow[]> {
  return db.select().from(skills).orderBy(asc(skills.order));
}

export async function getServices(): Promise<ServiceRow[]> {
  return db.select().from(services).orderBy(asc(services.order));
}

export async function getSocialLinks(): Promise<SocialRow[]> {
  const rows = await db.select().from(socialLinks).orderBy(asc(socialLinks.order));
  return rows.map((r) => ({
    platform: r.platform,
    url: r.url,
    username: r.username ?? "",
    order: r.order,
  }));
}

export async function getFundingLinks(): Promise<FundingRow[]> {
  const rows = await db.select().from(fundingLinks).orderBy(asc(fundingLinks.order));
  return rows.map((r) => ({
    label: r.label,
    url: r.url,
    primary: r.primary,
    order: r.order,
  }));
}
