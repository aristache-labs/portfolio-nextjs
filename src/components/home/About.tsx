import {
  CalendarDays,
  FolderGit2,
  Layers,
  MapPin,
  Rocket,
  Server,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { AvatarPortrait } from "./AvatarPortrait";
import { Section } from "@/components/ui/Section";
import { ICON_PROPS, IconTile } from "@/components/ui/IconTile";
import { SectionBackdrop } from "./SectionBackdrop";
import motionCss from "./skills-motion.module.css";

export type AboutProfile = {
  bio: string;
  stats: { years: number; repos: number; stars: number; followers: number };
  name?: string;
  avatarUrl?: string;
};

const GLASS =
  "border border-white/10 bg-[linear-gradient(180deg,rgb(255_255_255/0.07),rgb(255_255_255/0.02))] backdrop-blur-[18px]";

const BADGES: { icon: LucideIcon; value: string; label: string }[] = [
  { icon: MapPin, value: "Romania", label: "Based in" },
  { icon: Rocket, value: "Aristache Labs", label: "Personal Projects" },
  { icon: Sparkles, value: "Solve. Build. Improve.", label: "My Philosophy" },
];

function StatBar({ repos }: { repos: number }) {
  const items: { icon: LucideIcon; value: string; label: string }[] = [
    { icon: CalendarDays, value: "8+", label: "Years of experience" },
    {
      icon: FolderGit2,
      value: repos >= 100 ? `${repos}+` : String(repos),
      label: "Public repos",
    },
    { icon: Layers, value: "Web & Mobile", label: "Applications" },
    { icon: Server, value: "Windows & Linux", label: "Systems" },
  ];

  return (
    <Reveal delay={0.1} className="mt-14">
      <div
        className={`${GLASS} relative overflow-hidden rounded-2xl px-5 py-4 shadow-[0_20px_60px_rgb(0_0_0/0.4)] sm:px-6`}
      >
        <span
          aria-hidden
          className={`${motionCss.lightning} via-brand-bright absolute top-0 left-0 h-px w-1/4 bg-gradient-to-r from-transparent to-transparent shadow-[0_0_12px_rgb(var(--brand-bright-rgb)/0.9)]`}
        />
        <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-4 sm:divide-x sm:divide-white/10">
          {items.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex min-w-0 items-center gap-3 px-1 sm:px-5 sm:first:pl-0">
              <IconTile size="md">
                <Icon className="size-5" {...ICON_PROPS} />
              </IconTile>
              <span className="min-w-0">
                <span className="font-display block text-xl leading-tight font-bold text-white sm:text-2xl">
                  {value}
                </span>
                <span className="block text-xs break-words text-white/50">{label}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

export function About({ profile }: { profile: AboutProfile }) {
  return (
    <Section
      id="about"
      className="scroll-mt-24 pt-12 pb-6 md:pt-28 md:pb-8"
      backdrop={
        <>
          <SectionBackdrop video="/media/about.mp4" poster="/media/about.webp" />
          <div
            aria-hidden
            className="bg-background/70 md:bg-background/50 pointer-events-none absolute inset-0 z-[1]"
          />
        </>
      }
    >
      <div>
        <Reveal>
          <div className="mb-8">
            <p className="text-muted mb-4 flex items-center gap-4 font-mono text-xs tracking-[0.3em] uppercase">
              <span>
                <span className="gradient-text mr-3 font-semibold">01</span>
                About
              </span>
              <span aria-hidden className="bg-border h-px flex-1" />
            </p>
            <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
              The <span className="gradient-text">Mind</span>
              <br />
              Behind the <span className="gradient-text">Code.</span>
            </h2>
          </div>
        </Reveal>

        <div className="flex flex-col-reverse gap-6 md:flex-row md:gap-12">
          <Reveal delay={0.08} className="min-w-0 flex-1">
            <div className="space-y-4">
              {profile.bio
                .split(/\n\s*\n/)
                .map((para) => para.trim())
                .filter(Boolean)
                .map((para, i) => (
                  <p
                    key={`bio-${i}`}
                    className={
                      i === 0
                        ? "text-base leading-relaxed text-white/100 sm:text-lg"
                        : "text-muted text-base leading-relaxed text-white/60 sm:text-lg"
                    }
                  >
                    {para}
                  </p>
                ))}
            </div>

            <div className="mt-9 grid gap-3 sm:max-w-[calc(100%-3.5rem)] sm:grid-cols-3">
              {BADGES.map(({ icon: Icon, value, label }) => (
                <div key={label} className={`${GLASS} rounded-2xl px-4 py-3.5`}>
                  <IconTile size="md">
                    <Icon className="size-5" {...ICON_PROPS} />
                  </IconTile>
                  <p className="mt-3 text-[15px] leading-tight font-bold text-white">{value}</p>
                  <p className="mt-1 text-xs leading-snug text-white/50">{label}</p>
                </div>
              ))}
            </div>
          </Reveal>

          {profile.avatarUrl && (
            <Reveal delay={0.14} className="mx-auto shrink-0 md:mx-0">
              <AvatarPortrait src={profile.avatarUrl} name={profile.name ?? "Cristache Adrian"} />
            </Reveal>
          )}
        </div>

        <StatBar repos={profile.stats.repos} />
      </div>
    </Section>
  );
}

export default About;
