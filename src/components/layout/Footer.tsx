"use client";

import { ArrowRight, ChevronRight, Mail, Sparkle, Workflow } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { m, type Variants } from "framer-motion";
import { Button } from "@/components/ui/Button";
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
  roles = [],
  homeHrefPrefix = "",
}: {
  socials: SocialRow[];
  email?: string | null;
  sponsorUrl?: string | null;
  roles?: string[];
  homeHrefPrefix?: string;
}) {
  const year = new Date().getFullYear();
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
            <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] font-extrabold tracking-tight text-white">
              Thanks for <span className="gradient-text">visiting.</span>
            </h2>
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
                  src="/brand/logo.svg"
                  alt=""
                  width={906}
                  height={939}
                  unoptimized
                  loading="eager"
                  style={{ aspectRatio: "906 / 939" }}
                  className="h-32 w-auto sm:h-36 [@media(orientation:landscape)_and_(max-width:1024px)]:h-32"
                />
              </Link>
              {roles.length > 0 && (
                <p className="mt-2 max-w-[290px] text-[15px] leading-relaxed text-white/70 sm:mt-2.5 sm:text-base [@media(orientation:landscape)_and_(max-width:1024px)]:text-[14px]">
                  {roles.map((role, index) => (
                    <span key={`${role}-${index}`} className="block">
                      {role}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </ProgressiveReveal>

          <ProgressiveReveal
            effect="cascade"
            duration={0}
            delay={0.1}
            staggerChildren={0.08}
            className={`${NAV_DIVIDER} max-sm:bg-background/40 max-sm:flex max-sm:flex-col max-sm:items-center max-sm:rounded-2xl max-sm:px-3.5 max-sm:py-2.5 lg:flex lg:flex-col lg:items-center [@media(orientation:landscape)_and_(max-width:1024px)]:flex [@media(orientation:landscape)_and_(max-width:1024px)]:flex-col [@media(orientation:landscape)_and_(max-width:1024px)]:items-center`}
          >
            <nav aria-label="Explore" className="w-full">
              <m.h3 initial={false} variants={itemVariants} className={`${HEADING} text-center`}>
                Explore
              </m.h3>
              <ul className="mx-auto mt-2 grid w-full max-w-[280px] grid-cols-2 gap-x-2 gap-y-0.5 sm:mt-3 [@media(orientation:landscape)_and_(max-width:1024px)]:gap-x-4 [@media(orientation:landscape)_and_(max-width:1024px)]:gap-y-2">
                {LINKS.map((link) => (
                  <m.li
                    key={link.href}
                    initial={false}
                    variants={itemVariants}
                    className={link.href === "#contact" ? "col-span-2" : undefined}
                  >
                    <Link
                      scroll={!homeHrefPrefix}
                      href={`${homeHrefPrefix}${link.href}`}
                      className={`group flex min-h-11 items-center justify-center gap-1.5 rounded-md py-1 text-[14px] text-white/80 transition-colors duration-200 hover:text-white sm:min-h-9 sm:text-white/70 ${FOCUS}`}
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
            effect="fade-from-left"
            duration={0.7}
            delay={0.15}
            className={`${layout.contact} ${DIVIDER} sm:col-span-2 lg:col-span-1 [@media(orientation:landscape)_and_(max-width:1024px)]:col-span-1 [@media(orientation:landscape)_and_(max-width:1024px)]:flex [@media(orientation:landscape)_and_(max-width:1024px)]:flex-col [@media(orientation:landscape)_and_(max-width:1024px)]:items-stretch [@media(orientation:landscape)_and_(max-width:1024px)]:text-center`}
          >
            <h3 className={HEADING}>Let&apos;s Connect</h3>
            <p className="mt-3 max-w-[340px] text-[15px] leading-relaxed text-white/70">
              Have something in mind? I&apos;d love to hear about it.
            </p>
            <Button
              href={`${homeHrefPrefix}#contact`}
              variant="primary"
              size="lg"
              className={`group mt-5 rounded-2xl px-7 py-3.5 shadow-[0_8px_32px_rgb(var(--brand-deep-rgb)/0.55)] [@media(orientation:landscape)_and_(max-width:1024px)]:self-center ${FOCUS}`}
            >
              <Mail className="size-4" aria-hidden />
              Send a Message
              <ArrowRight
                className="size-4 transition-transform duration-300 motion-safe:group-hover:translate-x-1"
                aria-hidden
              />
            </Button>
          </ProgressiveReveal>
        </div>

        <ProgressiveReveal
          effect="cascade"
          duration={0}
          delay={0.1}
          staggerChildren={0.1}
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
            <span aria-hidden className="mx-1.5 text-white/30 max-md:hidden">
              |
            </span>
            <span className="inline-flex items-baseline whitespace-nowrap max-md:mt-1">
              <Link
                href="/privacy"
                className={`text-brand-bright underline-offset-4 transition-colors hover:text-white hover:underline ${FOCUS}`}
              >
                Privacy
              </Link>
              {sponsorUrl?.trim() && (
                <>
                  <span aria-hidden className="mx-1.5 text-white/30">
                    |
                  </span>
                  <a
                    href={sponsorUrl.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-white/60 underline-offset-4 transition-colors hover:text-white hover:underline ${FOCUS}`}
                  >
                    Support
                  </a>
                </>
              )}
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
            {SITE.handle}
          </m.p>
        </ProgressiveReveal>
      </div>
    </footer>
  );
}

export default Footer;
