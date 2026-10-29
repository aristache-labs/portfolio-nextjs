import { ProgressiveReveal } from "@/components/motion/ProgressiveReveal";
import { AvatarPortrait } from "./AvatarPortrait";
import { AboutPortraitMotion } from "./AboutPortraitMotion";
import { AboutIntroduction } from "./AboutIntroduction";
import { Section } from "@/components/ui/Section";
import { SectionBackdrop } from "./SectionBackdrop";
import labelCss from "@/components/ui/section-label.module.css";
import statsCss from "./about-stats.module.css";
import { AboutBio } from "./AboutBio";
import { SITE } from "@/lib/seo/site";
import { IDENTITY } from "@/lib/identity";
import { AboutSequence } from "./AboutSequence";
import { AboutMetric } from "./AboutMetric";

export type AboutProfile = {
  bio: string;
  stats: { years: number; repos: number; stars: number; followers: number };
  name?: string;
  avatarUrl?: string;
};

function StatBar() {
  const items: { value: string; label: string }[] = [
    { value: IDENTITY.manualWorkReduction, label: "Less manual work" },
    {
      value: IDENTITY.deploymentLocations,
      label: "Locations upgraded",
    },
    { value: IDENTITY.teamSize, label: "Team members led" },
    { value: IDENTITY.experienceYears, label: "Years of experience" },
  ];

  return (
    <div className={statsCss.results}>
      <div className={statsCss.panel}>
        <div className={statsCss.grid}>
          {items.map(({ value, label }, index) => (
            <AboutMetric key={label} index={index} className={statsCss.item}>
              <div className={statsCss.metricGroup}>
                <span className="min-w-0 text-left">
                  <span
                    className={`${statsCss.numberValue} font-display block text-xl leading-tight font-bold text-white sm:text-2xl`}
                  >
                    {value}
                  </span>
                  <span className={`${statsCss.label} block text-xs break-words text-white/50`}>
                    {label}
                  </span>
                </span>
              </div>
            </AboutMetric>
          ))}
        </div>
      </div>
    </div>
  );
}

export function About({ profile, number = "01" }: { profile: AboutProfile; number?: string }) {
  const bio = profile.bio.trim();
  const introduction = bio.match(/^[\s\S]*?[.!?](?=\s|$)/)?.[0] ?? bio;
  const remainingBio = bio.slice(introduction.length).trim();
  return (
    <Section
      id="about"
      className={`${statsCss.section} scroll-mt-[80px] pt-0 pb-6 md:scroll-mt-2 md:pt-28 md:pb-8`}
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
          <ProgressiveReveal className={statsCss.heading} effect="fade">
            <div>
              <p className={labelCss.label}>
                <span className={labelCss.number}>{number}</span>
                <span>About</span>
                <span aria-hidden className={labelCss.rule} />
              </p>
              <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
                Behind the <span className="gradient-text">code</span>.
              </h2>
            </div>
          </ProgressiveReveal>
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
        <div>
          <StatBar />
        </div>
      </AboutSequence>
    </Section>
  );
}

export default About;
