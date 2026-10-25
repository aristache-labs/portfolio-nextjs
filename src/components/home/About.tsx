import { CalendarDays, MapPin, TrendingDown, Users, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { AvatarPortrait } from "./AvatarPortrait";
import { Section } from "@/components/ui/Section";
import { ICON_PROPS, IconTile } from "@/components/ui/IconTile";
import { SectionBackdrop } from "./SectionBackdrop";
import labelCss from "@/components/ui/section-label.module.css";
import statsCss from "./about-stats.module.css";
import { AboutBio } from "./AboutBio";
import { SITE } from "@/lib/seo/site";
import { IDENTITY } from "@/lib/identity";

export type AboutProfile = {
  bio: string;
  stats: { years: number; repos: number; stars: number; followers: number };
  name?: string;
  avatarUrl?: string;
};

const GLASS =
  "border border-white/10 bg-[linear-gradient(180deg,rgb(255_255_255/0.07),rgb(255_255_255/0.02))] backdrop-blur-[18px]";

function StatBar() {
  const items: { icon: LucideIcon; value: string; label: string }[] = [
    { icon: TrendingDown, value: IDENTITY.manualWorkReduction, label: "Less manual work" },
    {
      icon: MapPin,
      value: IDENTITY.deploymentLocations,
      label: "Locations upgraded",
    },
    { icon: Users, value: IDENTITY.teamSize, label: "Team members led" },
    { icon: CalendarDays, value: IDENTITY.experienceYears, label: "Years of experience" },
  ];

  return (
    <Reveal
      distance={12}
      duration={0.4}
      delay={0.1}
      className="mt-8 lg:col-span-2 lg:mt-14 [@media(orientation:landscape)_and_(max-height:500px)]:col-span-2"
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
                    {value}
                  </span>
                  <span className={`${statsCss.label} block text-xs break-words text-white/50`}>
                    {label}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

export function About({ profile, number = "01" }: { profile: AboutProfile; number?: string }) {
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
            deferUntilNearViewport
            responsivePoster={{
              srcSet:
                "/media/about-640.webp 640w, /media/about-960.webp 960w, /media/about.webp 1600w",
              aspectRatio: 16 / 9,
            }}
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
            <p className={labelCss.label}>
              <span className={labelCss.number}>{number}</span>
              <span>About</span>
              <span aria-hidden className={labelCss.rule} />
            </p>
            <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
              Behind the <span className="gradient-text">code</span>.
            </h2>
          </div>
        </div>
        <div className={statsCss.copy}>
          <AboutBio bio={profile.bio} />
        </div>
      </Reveal>
      <div>
        <StatBar />
      </div>
    </Section>
  );
}

export default About;
