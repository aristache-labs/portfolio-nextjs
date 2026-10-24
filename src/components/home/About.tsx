import { CalendarDays, FolderGit2, Layers, Server, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { AvatarPortrait } from "./AvatarPortrait";
import { Section } from "@/components/ui/Section";
import { ICON_PROPS, IconTile } from "@/components/ui/IconTile";
import { SectionBackdrop } from "./SectionBackdrop";
import statsCss from "./about-stats.module.css";
import { AboutBio } from "./AboutBio";
import { SITE } from "@/lib/seo/site";

export type AboutProfile = {
  bio: string;
  stats: { years: number; repos: number; stars: number; followers: number };
  name?: string;
  avatarUrl?: string;
};

const GLASS =
  "border border-white/10 bg-[linear-gradient(180deg,rgb(255_255_255/0.07),rgb(255_255_255/0.02))] backdrop-blur-[18px]";

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
    <Reveal
      distance={12}
      duration={0.4}
      delay={0.1}
      className="mt-14 lg:col-span-2 [@media(orientation:landscape)_and_(max-height:500px)]:col-span-2"
    >
      <div
        className={`${statsCss.panel} ${GLASS} relative overflow-hidden rounded-2xl px-5 py-4 shadow-[0_20px_60px_rgb(0_0_0/0.4)] sm:px-6`}
      >
        <span
          aria-hidden
          className="via-brand-mid/40 absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent"
        />
        <div
          className={`${statsCss.grid} grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4 lg:divide-x lg:divide-white/10`}
        >
          {items.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className={`${statsCss.item} flex min-w-0 items-center gap-3 px-1 lg:px-3 lg:first:pl-0 lg:last:pr-0`}
            >
              <IconTile size="md">
                <Icon className="size-5" {...ICON_PROPS} />
              </IconTile>
              <span className="min-w-0">
                <span
                  className={`font-display block leading-tight text-white ${value === "Web & Mobile" || value === "Windows & Linux" ? `${statsCss.textValue} text-base font-semibold xl:text-lg` : `${statsCss.numberValue} text-xl font-bold sm:text-2xl`}`}
                >
                  {value}
                </span>
                <span className={`${statsCss.label} block text-xs break-words text-white/50`}>
                  {label}
                </span>
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
      className="scroll-mt-[80px] pt-0 pb-6 md:scroll-mt-2 md:pt-28 md:pb-8"
      backdrop={
        <>
          <SectionBackdrop
            video="/media/about.mp4"
            poster="/media/about.webp"
            fetchPriority="low"
            deferUntilHeroLoaded
          />
          <div
            aria-hidden
            className="bg-background/80 pointer-events-none absolute inset-0 z-[1]"
          />
        </>
      }
    >
      <Reveal distance={12} duration={0.4} className={statsCss.biography}>
        {profile.avatarUrl && (
          <div className={statsCss.portrait}>
            <AvatarPortrait src={profile.avatarUrl} name={profile.name ?? SITE.name} />
          </div>
        )}
        <div className={statsCss.heading}>
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
        </div>
        <div className={statsCss.copy}>
          <AboutBio bio={profile.bio} />
        </div>
      </Reveal>
      <div>
        <StatBar repos={profile.stats.repos} />
      </div>
    </Section>
  );
}

export default About;
