"use client";

import { m } from "framer-motion";
import { ArrowRight, ArrowUpRight, ChevronRight, Mail, Sparkle, Workflow } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useReducedMotionProps } from "@/hooks/useReducedMotion";
import type { SocialRow } from "@/components/home/social-icons";
import { SectionBackdrop } from "@/components/home/SectionBackdrop";
import motionCss from "@/components/navbar/support-motion.module.css";

const EASE = [0.22, 1, 0.36, 1] as const;

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

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.65, delay, ease: EASE },
});

export function Footer({
  sponsorUrl,
}: {
  socials: SocialRow[];
  email?: string | null;
  sponsorUrl?: string | null;
}) {
  const year = new Date().getFullYear();
  const reducedMotionProps = useReducedMotionProps();

  return (
    <footer className="relative overflow-hidden">
      <SectionBackdrop poster="/media/footer.webp" scrim="bg-background/70 absolute inset-0" />
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
        <div className="flex flex-col items-center text-center">
          <m.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: EASE }}
            {...reducedMotionProps}
            className="font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] font-extrabold tracking-tight text-white"
          >
            Thanks for <span className="gradient-text">visiting.</span>
          </m.h2>

          <m.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.08 }}
            {...reducedMotionProps}
            className="text-muted mx-auto mt-2 max-w-[580px] text-[14px] leading-relaxed"
          >
            Open to projects, collaborations, and problems worth solving.
          </m.p>
          <m.div
            initial={{ opacity: 0, scaleX: 0.9 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.14, ease: EASE }}
            {...reducedMotionProps}
            className="mx-auto mt-5 flex w-full max-w-[620px] items-center gap-4"
          >
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/25" />
            <Sparkle className="fill-brand-mid text-brand-bright size-4 shrink-0 drop-shadow-[0_0_8px_rgb(var(--brand-mid-rgb)/0.8)]" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/25" />
          </m.div>
        </div>

        <div className="mt-6 grid grid-cols-1 items-center gap-x-10 gap-y-7 sm:mt-8 sm:grid-cols-2 sm:gap-y-8 lg:mt-10 lg:grid-cols-3 [@media(orientation:landscape)_and_(max-width:1024px)]:grid-cols-3 [@media(orientation:landscape)_and_(max-width:1024px)]:gap-x-4">
          <m.div
            {...rise(0.05)}
            {...reducedMotionProps}
            className="flex min-w-0 flex-col items-center justify-center"
          >
            <div className="flex flex-col items-center text-center">
              <Link
                href="#hero"
                aria-label="Aristache, back to top"
                className={`inline-block rounded-lg ${FOCUS}`}
              >
                <Image
                  src="/brand/logo.svg"
                  alt=""
                  width={906}
                  height={939}
                  unoptimized
                  className="h-32 w-auto sm:h-36 [@media(orientation:landscape)_and_(max-width:1024px)]:h-28"
                />
              </Link>
              <p className="mt-2 max-w-[290px] text-[15px] leading-relaxed text-white/70 sm:mt-2.5 sm:text-base [@media(orientation:landscape)_and_(max-width:1024px)]:text-[14px]">
                Diagnose. Build. Automate.
              </p>
            </div>
          </m.div>

          <m.nav
            {...rise(0.12)}
            {...reducedMotionProps}
            aria-label="Explore"
            className={`${NAV_DIVIDER} max-sm:bg-background/40 max-sm:flex max-sm:flex-col max-sm:items-center max-sm:rounded-2xl max-sm:px-3.5 max-sm:py-2.5 lg:flex lg:flex-col lg:items-center [@media(orientation:landscape)_and_(max-width:1024px)]:flex [@media(orientation:landscape)_and_(max-width:1024px)]:flex-col [@media(orientation:landscape)_and_(max-width:1024px)]:items-center`}
          >
            <h3 className={`${HEADING} text-center`}>Explore</h3>
            <ul className="mx-auto mt-2 grid w-full max-w-[280px] grid-cols-2 gap-x-2 gap-y-0.5 sm:mt-3 [@media(orientation:landscape)_and_(max-width:1024px)]:gap-x-4 [@media(orientation:landscape)_and_(max-width:1024px)]:gap-y-2">
              {LINKS.map((link) => (
                <li key={link.href} className={link.href === "#contact" ? "col-span-2" : undefined}>
                  <a
                    href={link.href}
                    className={`group flex min-h-11 items-center justify-center gap-1.5 rounded-md py-1 text-[14px] text-white/80 transition-colors duration-200 hover:text-white sm:min-h-9 sm:text-white/70 ${FOCUS}`}
                  >
                    <ChevronRight
                      className="text-brand-mid group-hover:text-brand-bright size-3.5 shrink-0 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5"
                      aria-hidden
                    />
                    <span>{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </m.nav>

          <m.div
            {...rise(0.19)}
            {...reducedMotionProps}
            className={`${DIVIDER} sm:col-span-2 lg:col-span-1 [@media(orientation:landscape)_and_(max-width:1024px)]:col-span-1 [@media(orientation:landscape)_and_(max-width:1024px)]:flex [@media(orientation:landscape)_and_(max-width:1024px)]:flex-col [@media(orientation:landscape)_and_(max-width:1024px)]:items-stretch [@media(orientation:landscape)_and_(max-width:1024px)]:text-center`}
          >
            {sponsorUrl?.trim() ? (
              <>
                <h3 className={HEADING}>Support My Work</h3>
                <a
                  href={sponsorUrl.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group hover:border-brand-mid/45 bg-background/85 hover:bg-background/95 mt-3 flex min-h-[112px] items-center gap-4 rounded-2xl border border-white/15 px-5 py-4 text-left shadow-[0_12px_28px_-18px_rgb(0_0_0/0.65),inset_0_1px_0_rgb(255_255_255/0.05)] backdrop-blur-xl transition-colors duration-300 [@media(orientation:landscape)_and_(max-width:1024px)]:min-h-[88px] [@media(orientation:landscape)_and_(max-width:1024px)]:w-full [@media(orientation:landscape)_and_(max-width:1024px)]:max-w-[280px] [@media(orientation:landscape)_and_(max-width:1024px)]:gap-2 [@media(orientation:landscape)_and_(max-width:1024px)]:self-center [@media(orientation:landscape)_and_(max-width:1024px)]:px-3 [@media(orientation:landscape)_and_(max-width:1024px)]:py-3 ${FOCUS}`}
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.03] [@media(orientation:landscape)_and_(max-width:1024px)]:size-9 [@media(orientation:landscape)_and_(max-width:1024px)]:translate-x-1">
                    <Image
                      src="/icons/heart.svg"
                      alt=""
                      width={18}
                      height={18}
                      className={`${motionCss.heart} size-[18px] object-contain`}
                    />
                  </span>
                  <span className="min-w-0 flex-1 [@media(orientation:landscape)_and_(max-width:1024px)]:pl-4">
                    <span className="text-muted block font-mono text-[10px] tracking-[0.2em] uppercase [@media(orientation:landscape)_and_(max-width:1024px)]:text-[9px] [@media(orientation:landscape)_and_(max-width:1024px)]:tracking-[0.12em]">
                      Independent development
                    </span>
                    <span className="mt-2 block text-[17px] leading-snug font-semibold tracking-tight text-white [@media(orientation:landscape)_and_(max-width:1024px)]:mt-1 [@media(orientation:landscape)_and_(max-width:1024px)]:text-[15px]">
                      Fuel Future Projects
                    </span>
                    <span className="mt-1 block text-[12px] leading-relaxed text-white/65 [@media(orientation:landscape)_and_(max-width:1024px)]:hidden">
                      Support useful tools and future releases.
                    </span>
                  </span>
                  <ArrowUpRight
                    className="size-4 shrink-0 text-white/55 transition-transform duration-300 motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
                    aria-hidden
                  />
                </a>
              </>
            ) : (
              <>
                <h3 className={HEADING}>Let&apos;s Connect</h3>
                <p className="mt-3 max-w-[340px] text-[15px] leading-relaxed text-white/70">
                  Have something in mind? I&apos;d love to hear about it.
                </p>
                <Button
                  href="#contact"
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
              </>
            )}
          </m.div>
        </div>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
          {...reducedMotionProps}
          className="bg-background/80 mt-8 grid items-center gap-3 rounded-xl border border-white/10 px-5 py-3.5 text-center sm:mt-10 md:grid-cols-[1fr_auto_1fr] md:gap-4 lg:mt-12 [@media(orientation:landscape)_and_(max-width:1024px)]:grid-cols-[1fr_auto]"
        >
          <p className="order-2 text-[13px] text-white/60 md:order-none md:text-left md:text-[13.5px]">
            <span className="max-md:block">
              <span className="text-brand-bright">&copy; {year}</span> Cristache Adrian. All rights
              reserved.
            </span>
            <span className="mx-1.5 text-white/30 max-md:hidden">|</span>
            <Link
              href="/privacy"
              className={`text-brand-bright underline-offset-4 transition-colors duration-200 hover:text-white hover:underline max-md:mt-1 max-md:block ${FOCUS}`}
            >
              Privacy
            </Link>
          </p>
          <div className="hidden items-center justify-center gap-2.5 md:flex [@media(orientation:landscape)_and_(max-width:1024px)]:hidden">
            <Workflow className="text-brand-mid size-5.5" aria-hidden />
            <span className="font-mono text-[11.5px] tracking-[0.28em] text-white/65">
              DIAGNOSE <span className="text-white/30">&times;</span>{" "}
              <span className="text-brand-bright">BUILD</span>{" "}
              <span className="text-white/30">&times;</span> AUTOMATE
            </span>
          </div>
          <p className="order-1 font-mono text-[11.5px] tracking-[0.28em] text-white/65 uppercase md:order-none md:text-right">
            <span className="text-brand-bright">Crafted</span> with Purpose.
          </p>
        </m.div>
      </div>
    </footer>
  );
}

export default Footer;
