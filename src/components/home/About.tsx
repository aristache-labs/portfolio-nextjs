import type { CSSProperties } from "react";
import { CalendarDays, MapPin, TrendingDown, Users, type LucideIcon } from "lucide-react";
import { AboutResults } from "./AboutResults";
import { AboutMilestones } from "./AboutMilestones";
import { AvatarPortrait } from "./AvatarPortrait";
import { AboutPortraitMotion } from "./AboutPortraitMotion";
import { AboutPortraitBadges } from "./AboutPortraitBadges";
import { AboutIntroduction } from "./AboutIntroduction";
import { Section } from "@/components/ui/Section";
import { SectionBackdrop } from "./SectionBackdrop";
import { SectionLabel } from "@/components/ui/SectionLabel";
import statsCss from "./about-stats.module.css";
import { AboutBio } from "./AboutBio";
import { SITE } from "@/lib/seo/site";
import { aboutStats, type AboutStat, type AboutStatKey } from "@/lib/about-stats";
import { AboutSequence } from "./AboutSequence";
import { AboutReveal } from "./AboutReveal";
import headingCss from "./section-heading.module.css";

export type AboutProfile = {
  bio: string;
  stats: { years: number; repos: number; stars: number; followers: number };
  /** The four result cards, edited in Admin -> Profile. Defaults apply when absent. */
  highlights?: AboutStat[];
  name?: string;
  avatarUrl?: string;
  /** Same note as the Hero; shown as a floating card on the portrait. */
  availability?: string | null;
};

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
      <AboutMilestones items={items} />
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
            poster="/media/about-frame.webp"
            fetchPriority="low"
            deferUntilHeroLoaded
            deferUntilNearViewport
            responsivePoster={{
              srcSet:
                "/media/about-frame-640.webp 640w, /media/about-frame-960.webp 960w, /media/about-frame.webp 1600w",
              aspectRatio: 16 / 9,
              portrait: {
                srcSet: "/media/about-frame-640.webp 640w, /media/about-frame-960.webp 960w",
                maxWidth: 960,
              },
            }}
          />
          <div
            aria-hidden
            className={`${statsCss.veil} pointer-events-none absolute inset-0 z-[1]`}
          />
        </>
      }
    >
      <AboutSequence
        details={
          remainingBio ? (
            <AboutReveal className={`${statsCss.copy} ${statsCss.paragraphReveal}`}>
              <AboutBio bio={remainingBio} />
            </AboutReveal>
          ) : undefined
        }
      >
        <div className={statsCss.biography} data-portrait={Boolean(profile.avatarUrl)}>
          <AboutReveal className={statsCss.heading} pinnedRootMargin="0px">
            <div>
              <SectionLabel
                number={number}
                name="About"
                className={`${statsCss.headingLabel} ${headingCss.label}`}
              />
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
          {/* Words blur in one by one (about-introduction.module.css), not the whole paragraph. */}
          <AboutReveal className={statsCss.introduction}>
            <AboutIntroduction text={introduction} />
          </AboutReveal>
          {profile.avatarUrl && (
            <AboutPortraitMotion
              // Tailwind's layered `relative` loses to the module's pinned `absolute`, as intended.
              className={`${statsCss.portrait} relative`}
              overlay={
                <AboutPortraitBadges
                  repos={profile.stats.repos}
                  stars={profile.stats.stars}
                  availability={profile.availability}
                />
              }
            >
              <AboutReveal className={statsCss.portraitEnter}>
                <AvatarPortrait
                  src={profile.avatarUrl}
                  name={profile.name ?? SITE.name}
                  scrollMotion
                />
              </AboutReveal>
            </AboutPortraitMotion>
          )}
        </div>
      </AboutSequence>
      <StatBar stats={profile.highlights ?? aboutStats(null)} />
    </Section>
  );
}

export default About;
