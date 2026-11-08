import type { CSSProperties } from "react";
import { CalendarDays, MapPin, TrendingDown, Users, type LucideIcon } from "lucide-react";
import { IconTile, ICON_PROPS } from "@/components/ui/IconTile";
import { SpringCount } from "@/components/motion/SpringCount";
import { AboutResults } from "./AboutResults";
import { AboutStatsBeam } from "./AboutStatsBeam";
import { AvatarPortrait } from "./AvatarPortrait";
import { AboutPortraitMotion } from "./AboutPortraitMotion";
import { AboutIntroduction } from "./AboutIntroduction";
import { Section } from "@/components/ui/Section";
import { SectionBackdrop } from "./SectionBackdrop";
import labelCss from "@/components/ui/section-label.module.css";
import statsCss from "./about-stats.module.css";
import { AboutBio } from "./AboutBio";
import { SITE } from "@/lib/seo/site";
import { aboutStats, type AboutStat, type AboutStatKey } from "@/lib/about-stats";
import { AboutSequence } from "./AboutSequence";
import { AboutReveal } from "./AboutReveal";
import portraitCss from "@/components/ui/portrait-card-surface.module.css";
import headingCss from "./section-heading.module.css";

export type AboutProfile = {
  bio: string;
  stats: { years: number; repos: number; stars: number; followers: number };
  /** The four result cards, edited in Admin -> Profile. Defaults apply when absent. */
  highlights?: AboutStat[];
  name?: string;
  avatarUrl?: string;
};

const GLASS =
  "border border-white/10 bg-[linear-gradient(180deg,rgb(255_255_255/0.07),rgb(255_255_255/0.02))] backdrop-blur-[18px]";

const STAT_ICONS: Record<AboutStatKey, LucideIcon> = {
  manualWorkReduction: TrendingDown,
  deploymentLocations: MapPin,
  teamSize: Users,
  experienceYears: CalendarDays,
};

function StatBar({ stats }: { stats: AboutStat[] }) {
  const items = stats.map((stat) => ({ ...stat, icon: STAT_ICONS[stat.key] }));

  return (
    <AboutResults
      className={`${statsCss.results} landscape-short:col-span-2 mt-8 lg:col-span-2 lg:mt-14`}
    >
      <div
        className={`${statsCss.panel} ${portraitCss.surface} ${GLASS} relative overflow-hidden rounded-2xl px-5 py-4 shadow-[0_20px_60px_rgb(0_0_0/0.4)] sm:px-6`}
      >
        <AboutStatsBeam />
        <AboutReveal
          className={`${statsCss.grid} grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4 lg:divide-x lg:divide-white/10`}
        >
          {items.map(({ key, icon: Icon, value, label }, index) => (
            <div
              key={key}
              style={{ "--i": index } as CSSProperties}
              className={`${statsCss.item} flex min-w-0 items-center justify-center px-1 lg:px-3`}
            >
              <div className={statsCss.metricGroup}>
                <IconTile size="md">
                  <Icon className="size-5" {...ICON_PROPS} />
                </IconTile>
                <span className="min-w-0 text-left">
                  <span
                    className={`${statsCss.numberValue} font-display block text-xl leading-tight font-bold text-white sm:text-2xl`}
                  >
                    <SpringCount value={value} />
                  </span>
                  <span className={`${statsCss.label} block text-xs break-words text-white/50`}>
                    {label}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </AboutReveal>
      </div>
    </AboutResults>
  );
}

export function About({ profile, number = "01" }: { profile: AboutProfile; number?: string }) {
  const bio = profile.bio.trim();
  const introduction = bio.match(/^[\s\S]*?[.!?](?=\s|$)/)?.[0] ?? bio;
  const remainingBio = bio.slice(introduction.length).trim();
  return (
    <Section
      id="about"
      className={`${statsCss.section} scroll-mt-[80px] pt-0 pb-16 md:scroll-mt-2 md:pt-28 md:pb-24`}
      backdrop={
        <>
          <SectionBackdrop
            video="/media/about-v3.mp4"
            poster="/media/about.webp"
            fetchPriority="low"
            deferUntilHeroLoaded
            deferUntilNearViewport
            responsivePoster={{
              srcSet:
                "/media/about-640.webp 640w, /media/about-960.webp 960w, /media/about.webp 1600w",
              aspectRatio: 16 / 9,
              portrait: {
                srcSet: "/media/about-640.webp 640w, /media/about-960.webp 960w",
                maxWidth: 960,
              },
            }}
          />
          <div
            aria-hidden
            className="bg-background/80 pointer-events-none absolute inset-0 z-[1]"
          />
        </>
      }
    >
      <AboutSequence
        details={
          remainingBio ? (
            <div className={statsCss.copy}>
              <AboutBio bio={remainingBio} />
            </div>
          ) : undefined
        }
      >
        <div className={statsCss.biography} data-portrait={Boolean(profile.avatarUrl)}>
          <AboutReveal className={statsCss.heading} pinnedRootMargin="0px">
            <div>
              <p className={`${labelCss.label} ${statsCss.headingLabel} ${headingCss.label}`}>
                <span className={labelCss.number}>{number}</span>
                <span>About</span>
                <span aria-hidden className={`${labelCss.rule} ${statsCss.rule}`} />
              </p>
              <h2 className={headingCss.title}>
                <span className={statsCss.word} style={{ "--i": 0 } as CSSProperties}>
                  Behind
                </span>{" "}
                <span className={statsCss.word} style={{ "--i": 1 } as CSSProperties}>
                  the
                </span>{" "}
                <span className={statsCss.word} style={{ "--i": 2 } as CSSProperties}>
                  <span className={`${statsCss.accentWord} ${headingCss.accent}`}>code</span>.
                </span>
              </h2>
            </div>
          </AboutReveal>
          <div className={statsCss.introduction}>
            <AboutIntroduction text={introduction} />
          </div>
          {profile.avatarUrl && (
            <AboutPortraitMotion className={statsCss.portrait}>
              <AvatarPortrait
                src={profile.avatarUrl}
                name={profile.name ?? SITE.name}
                scrollMotion
              />
            </AboutPortraitMotion>
          )}
        </div>
      </AboutSequence>
      <StatBar stats={profile.highlights ?? aboutStats(null)} />
    </Section>
  );
}

export default About;
