"use client";

import { ChevronRight, Sparkle, Workflow } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { m, type Variants } from "framer-motion";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { ProgressiveReveal } from "@/components/motion/ProgressiveReveal";
import type { SocialRow } from "@/components/home/social-icons";
import { SectionBackdrop } from "@/components/home/SectionBackdrop";
import subtitleCss from "@/components/home/section-subtitle.module.css";
import { SITE } from "@/lib/seo/site";
import layout from "./footer-layout.module.css";

const LINKS = [
  { label: "Home", href: "#hero" },
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Services", href: "#services" },
  { label: "Contact", href: "#contact" },
];

const DIVIDER = "min-w-0 lg:pl-10 [@media(orientation:landscape)_and_(max-width:1024px)]:pl-0";
const NAV_DIVIDER =
  "min-w-0 lg:border-x lg:border-white/10 lg:px-8 [@media(orientation:landscape)_and_(max-width:1024px)]:self-stretch [@media(orientation:landscape)_and_(max-width:1024px)]:justify-center [@media(orientation:landscape)_and_(max-width:1024px)]:border-x [@media(orientation:landscape)_and_(max-width:1024px)]:border-white/10 [@media(orientation:landscape)_and_(max-width:1024px)]:px-4";
const HEADING = "font-display text-[17px] font-semibold tracking-tight text-white";
const FOCUS =
  "focus-visible:ring-brand-mid/70 focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";

export function Footer({
  sponsorUrl,
  heroTagline,
  sectionVisibility = {},
  homeHrefPrefix = "",
}: {
  socials: SocialRow[];
  email?: string | null;
  sponsorUrl?: string | null;
  heroTagline?: string | null;
  sectionVisibility?: Record<string, boolean>;
  homeHrefPrefix?: string;
}) {
  const year = new Date().getFullYear();
  const legalLinks = [
    { label: "Privacy", href: "/privacy", external: false },
    { label: "GDPR", href: "/gdpr", external: false },
  ];
  const visibleLinks = [
    ...LINKS.filter(
      (link) => link.href === "#hero" || sectionVisibility[link.href.slice(1)] !== false,
    ).map((link) => ({ ...link, href: `${homeHrefPrefix}${link.href}`, external: false })),
    ...(sponsorUrl?.trim()
      ? [{ label: "Buy me a coffee", href: sponsorUrl.trim(), external: true }]
      : []),
  ];
  const { mode } = useAnimationPolicy();
  const itemVariants: Variants = {
    hidden: mode === "static" ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: mode === "static" ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <footer className={`${layout.footer} relative overflow-hidden`}>
      <SectionBackdrop
        poster="/media/footer.webp"
        fetchPriority="low"
        deferUntilHeroLoaded
        deferUntilNearViewport
        responsivePoster={{
          srcSet:
            "/media/footer-640.webp 640w, /media/footer-960.webp 960w, /media/footer-1600.webp 1600w",
          aspectRatio: 16 / 9,
        }}
        scrim="bg-background/70 absolute inset-0"
      />
      {/* Readability without hiding the skyline: dark at the top and bottom, open through the middle. */}
      <div
        aria-hidden
        className="from-background/80 via-background/10 to-background/90 pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b"
      />
      {/* Soft obsidian pool behind the columns only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[62%] bg-[radial-gradient(ellipse_70%_80%_at_50%_70%,rgb(8_12_13/0.72),transparent)]"
      />

      <div className="site-container relative z-10 pt-6 pb-24 sm:pb-8 lg:pt-8">
        <div className={`${layout.intro} flex flex-col items-center text-center`}>
          <ProgressiveReveal effect="focus" duration={0.7} delay={0.1}>
            <p className="font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] font-extrabold tracking-tight text-white">
              Thanks for <span className="gradient-text">visiting.</span>
            </p>
          </ProgressiveReveal>

          <ProgressiveReveal effect="fade" duration={0.65} delay={0.15}>
            <p className={`${subtitleCss.subtitle} mx-auto mt-2 max-w-[580px]`}>
              IT infrastructure, deployment automation, web and mobile development.
            </p>
          </ProgressiveReveal>
          <div className="mx-auto mt-5 flex w-full max-w-[620px] items-center gap-4">
            <ProgressiveReveal effect="line" className="flex-1 origin-right">
              <span
                aria-hidden
                className="block h-px bg-gradient-to-r from-transparent to-white/25"
              />
            </ProgressiveReveal>
            <ProgressiveReveal effect="zoom" duration={0.6} delay={0.1} className="shrink-0">
              <Sparkle
                aria-hidden
                className="fill-brand-mid text-brand-bright size-4 drop-shadow-[0_0_8px_rgb(var(--brand-mid-rgb)/0.8)]"
              />
            </ProgressiveReveal>
            <ProgressiveReveal effect="line" className="flex-1 origin-left">
              <span
                aria-hidden
                className="block h-px bg-gradient-to-l from-transparent to-white/25"
              />
            </ProgressiveReveal>
          </div>
        </div>

        <div
          className={`${layout.columns} mt-6 grid grid-cols-1 items-center gap-x-10 gap-y-7 sm:mt-8 sm:grid-cols-2 sm:gap-y-8 lg:mt-10 lg:grid-cols-3 [@media(orientation:landscape)_and_(max-width:1024px)]:grid-cols-3 [@media(orientation:landscape)_and_(max-width:1024px)]:gap-x-4`}
        >
          <ProgressiveReveal
            effect="zoom"
            duration={0.7}
            delay={0.1}
            className={`${layout.identity} flex min-w-0 flex-col items-center justify-center`}
          >
            <div className="flex flex-col items-center text-center">
              <Link
                href={`${homeHrefPrefix}#hero`}
                aria-label="Aristache, back to top"
                className={`inline-block rounded-lg ${FOCUS}`}
              >
                <Image
                  src="/brand/logo-full-v2.webp"
                  alt=""
                  width={400}
                  height={415}
                  unoptimized
                  loading="lazy"
                  style={{ aspectRatio: "400 / 415" }}
                  className="h-32 w-auto sm:h-35 [@media(orientation:landscape)_and_(max-width:1024px)]:h-45"
                />
              </Link>
              {heroTagline && (
                <p className="mt-2 max-w-[290px] sm:mt-2.5">
                  <span className="border-border bg-background/40 text-muted inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] uppercase backdrop-blur-sm">
                    {heroTagline}
                  </span>
                </p>
              )}
            </div>
          </ProgressiveReveal>

          <ProgressiveReveal
            effect="cascade"
            duration={0}
            delay={0.1}
            staggerChildren={0.08}
            className={`${layout.explore} ${NAV_DIVIDER} max-sm:bg-background/40 max-sm:flex max-sm:flex-col max-sm:items-center max-sm:rounded-2xl max-sm:px-3.5 max-sm:py-2.5 lg:flex lg:flex-col lg:items-center [@media(orientation:landscape)_and_(max-width:1024px)]:flex [@media(orientation:landscape)_and_(max-width:1024px)]:flex-col [@media(orientation:landscape)_and_(max-width:1024px)]:items-center`}
          >
            <nav aria-label="Explore" className="w-full">
              <m.h3 initial={false} variants={itemVariants} className={`${HEADING} text-center`}>
                Explore
              </m.h3>
              <ul
                className={`${layout.links} mx-auto mt-2 grid w-full max-w-[280px] grid-flow-col grid-cols-2 gap-x-2 gap-y-0.5 sm:mt-3 [@media(orientation:landscape)_and_(max-width:1024px)]:gap-x-4 [@media(orientation:landscape)_and_(max-width:1024px)]:gap-y-4`}
                style={{ gridTemplateRows: `repeat(${Math.ceil(visibleLinks.length / 2)}, auto)` }}
              >
                {visibleLinks.map((link) => (
                  <m.li key={link.href} initial={false} variants={itemVariants}>
                    <Link
                      scroll={link.external ? undefined : !homeHrefPrefix}
                      href={link.href}
                      {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className={`group flex min-h-11 items-center justify-start gap-1.5 rounded-md py-1 text-left text-[14px] text-white/80 transition-colors duration-200 hover:text-white sm:min-h-9 sm:text-white/70 ${FOCUS}`}
                    >
                      <ChevronRight
                        className="text-brand-mid group-hover:text-brand-bright size-3.5 shrink-0 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5"
                        aria-hidden
                      />
                      <span>{link.label}</span>
                    </Link>
                  </m.li>
                ))}
              </ul>
            </nav>
          </ProgressiveReveal>

          <ProgressiveReveal
            effect="cascade"
            duration={0}
            delay={0.1}
            staggerChildren={0.08}
            className={`${layout.resources} ${DIVIDER} sm:col-span-2 lg:col-span-1 [@media(orientation:landscape)_and_(max-width:1024px)]:col-span-1`}
          >
            <nav aria-label="Legal" className="w-full">
              <m.h3 initial={false} variants={itemVariants} className={`${HEADING} text-center`}>
                Legal
              </m.h3>
              <ul className="mx-auto mt-2 grid w-fit grid-cols-1 grid-rows-3 items-center gap-y-0.5 sm:mt-3 [@media(orientation:landscape)_and_(max-width:1024px)]:gap-y-4">
                {legalLinks.map((link, index) => (
                  <m.li
                    key={link.href}
                    initial={false}
                    variants={itemVariants}
                    className="col-start-1"
                    style={{ gridRow: index + 1 }}
                  >
                    <Link
                      href={link.href}
                      {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className={`group flex min-h-11 items-center justify-start gap-1.5 rounded-md py-1 text-left text-[14px] text-white/80 transition-colors duration-200 hover:text-white sm:min-h-9 sm:text-white/70 ${FOCUS}`}
                    >
                      <ChevronRight
                        aria-hidden
                        className="text-brand-mid group-hover:text-brand-bright size-3.5 shrink-0 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5"
                      />
                      {link.label}
                    </Link>
                  </m.li>
                ))}
              </ul>
            </nav>
          </ProgressiveReveal>
        </div>

        <ProgressiveReveal
          effect="rise"
          duration={1.8}
          delay={0.35}
          ease={[0.22, 0.85, 0.35, 1]}
          viewportInset={0}
          className={`${layout.legal} bg-background/80 mt-8 grid items-center gap-3 rounded-xl border border-white/10 px-5 py-3.5 text-center sm:mt-10 md:grid-cols-[1fr_auto_1fr] md:gap-4 lg:mt-12 [@media(orientation:landscape)_and_(max-width:1024px)]:grid-cols-[1fr_auto]`}
        >
          <m.div
            initial={false}
            variants={itemVariants}
            className="order-2 text-[13px] text-white/60 md:order-none md:text-left md:text-[13.5px]"
          >
            <span className="max-md:block">
              <span className="text-brand-bright">&copy; {year}</span> {SITE.name}. All rights
              reserved.
            </span>
          </m.div>
          <m.div
            initial={false}
            variants={itemVariants}
            className="hidden items-center justify-center gap-2.5 md:flex [@media(orientation:landscape)_and_(max-width:1024px)]:hidden"
          >
            <Workflow className="text-brand-mid size-5.5" aria-hidden />
            <span className="font-mono text-[11.5px] tracking-[0.28em] text-white/65">
              WEB <span className="text-white/30">·</span>{" "}
              <span className="text-brand-bright">MOBILE</span>{" "}
              <span className="text-white/30">·</span> INFRASTRUCTURE
            </span>
          </m.div>
          <m.p
            initial={false}
            variants={itemVariants}
            className="order-1 font-mono text-[11.5px] tracking-[0.28em] text-white/65 uppercase md:order-none md:text-right"
          >
            DESIGNED &amp; BUILT WITH <span className="text-brand-bright">CARE</span>
          </m.p>
        </ProgressiveReveal>
      </div>
    </footer>
  );
}

export default Footer;
