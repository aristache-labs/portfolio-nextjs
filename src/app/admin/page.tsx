import Link from "next/link";
import { sql } from "drizzle-orm";
import {
  FolderGit2,
  Briefcase,
  Wrench,
  Sparkles,
  Link2,
  HandCoins,
  User,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { db } from "@/db/client";
import {
  profile,
  projects,
  experiences,
  skills,
  services,
  socialLinks,
  fundingLinks,
} from "@/db/schema";
export const dynamic = "force-dynamic";

const cards = [
  { href: "/admin/projects", label: "Projects", icon: FolderGit2, key: "projects" },
  { href: "/admin/experiences", label: "Experiences", icon: Briefcase, key: "experiences" },
  { href: "/admin/skills", label: "Skills", icon: Wrench, key: "skills" },
  { href: "/admin/services", label: "Services", icon: Sparkles, key: "services" },
  { href: "/admin/social-links", label: "Social Links", icon: Link2, key: "socialLinks" },
  { href: "/admin/funding-links", label: "Funding Links", icon: HandCoins, key: "fundingLinks" },
] as const;

const count = sql<number>`count(*)`;

export default async function AdminDashboard() {
  const [[proj], [exp], [skl], [svc], [social], [funding], [profileRow]] = await Promise.all([
    db.select({ n: count }).from(projects),
    db.select({ n: count }).from(experiences),
    db.select({ n: count }).from(skills),
    db.select({ n: count }).from(services),
    db.select({ n: count }).from(socialLinks),
    db.select({ n: count }).from(fundingLinks),
    db.select({ id: profile.id }).from(profile).limit(1),
  ]);

  const counts: Record<string, number> = {
    projects: Number(proj.n),
    experiences: Number(exp.n),
    skills: Number(skl.n),
    services: Number(svc.n),
    socialLinks: Number(social.n),
    fundingLinks: Number(funding.n),
  };
  const profileConfigured = Boolean(profileRow);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-foreground text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted mt-1 text-sm">Manage everything that powers your portfolio.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.href}
              href={c.href}
              className="border-border bg-surface hover:border-foreground/20 hover:bg-surface-2 flex flex-col gap-3 rounded-2xl border p-5 transition"
            >
              <span className="grid size-9 place-items-center rounded-lg bg-(image:--gradient-brand) text-white">
                <Icon className="size-4.5" aria-hidden />
              </span>
              <div>
                <div className="text-foreground text-2xl font-bold tabular-nums">
                  {counts[c.key]}
                </div>
                <div className="text-muted text-sm">{c.label}</div>
              </div>
            </Link>
          );
        })}
      </div>

      <Link
        href="/admin/profile"
        className="border-border bg-surface hover:border-foreground/20 hover:bg-surface-2 flex items-center justify-between gap-4 rounded-2xl border p-5 transition"
      >
        <div className="flex items-center gap-4">
          <span className="grid size-10 place-items-center rounded-xl bg-(image:--gradient-brand) text-white">
            <User className="size-5" aria-hidden />
          </span>
          <div>
            <div className="text-foreground font-semibold">Profile</div>
            <div className="text-muted text-sm">Your name, bio, and resume link</div>
          </div>
        </div>
        {profileConfigured ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-medium text-emerald-500">
            <CheckCircle2 className="size-3.5" aria-hidden />
            Configured
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-2.5 py-1 text-xs font-medium text-amber-500">
            <Clock className="size-3.5" aria-hidden />
            Not set up
          </span>
        )}
      </Link>
    </div>
  );
}
