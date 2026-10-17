"use client";

import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, Heart, Mail, Sparkle, Workflow } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { SocialRow } from "@/components/home/social-icons";
import { SectionBackdrop } from "@/components/home/SectionBackdrop";

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

const DIVIDER = "min-w-0 lg:border-l lg:border-white/10 lg:pl-10";
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
          <motion.span
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="border-brand-mid/30 bg-brand-mid/10 text-brand-bright inline-flex items-center rounded-full border px-5 py-2 font-mono text-[11px] tracking-[0.32em] backdrop-blur-md"
          >
            END OF THE PAGE
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
            className="font-display mt-6 text-[clamp(2.2rem,4.4vw,3.6rem)] leading-[1.08] font-extrabold tracking-tight text-white"
          >
            Thanks for <span className="gradient-text">visiting.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.18 }}
            className="mt-3.5 max-w-[580px] text-[16px] leading-[1.6] text-white/75 sm:mt-4 sm:text-[17px]"
          >
            Open to projects, collaborations, and problems worth solving.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scaleX: 0.85 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.26, ease: EASE }}
            className="mt-7 flex w-full max-w-[620px] items-center gap-4 sm:mt-8"
          >
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/25" />
            <Sparkle className="fill-brand-mid text-brand-bright size-4 shrink-0 drop-shadow-[0_0_8px_rgb(var(--brand-mid-rgb)/0.8)]" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/25" />
          </motion.div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-8 sm:mt-10 sm:grid-cols-2 sm:gap-y-10 lg:mt-12 lg:grid-cols-[3fr_3fr_4fr]">
          <motion.div {...rise(0.05)} className="flex min-w-0 flex-col items-center sm:items-start">
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
                  className="h-28 w-auto sm:h-36"
                />
              </Link>
              <p className="mt-3 max-w-[290px] text-[20px] leading-relaxed text-white/70 sm:mt-3.5">
                Diagnose. Build. Automate.
              </p>
              {sponsorUrl?.trim() && (
                <a
                  href={sponsorUrl.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`border-brand-mid/35 text-brand-mid hover:border-brand-mid/70 hover:bg-brand-mid/10 hover:text-brand-bright mt-4 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${FOCUS}`}
                >
                  <Heart className="size-3.5" aria-hidden />
                  Fuel Future Projects
                </a>
              )}
            </div>
          </motion.div>

          <motion.nav
            {...rise(0.12)}
            aria-label="Explore"
            className={`${DIVIDER} max-sm:bg-background/40 max-sm:rounded-2xl max-sm:px-3.5 max-sm:py-2.5`}
          >
            <h3 className={HEADING}>Explore</h3>
            <ul className="mt-3 grid grid-cols-1 gap-y-0 sm:mt-4 sm:gap-y-1">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className={`group flex min-h-11 items-center gap-2 rounded-md py-1 text-[15px] text-white/80 transition-colors duration-200 hover:text-white sm:min-h-9 sm:text-white/70 ${FOCUS}`}
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
          </motion.nav>

          <motion.div {...rise(0.19)} className={`${DIVIDER} sm:col-span-2 lg:col-span-1`}>
            <h3 className={HEADING}>Let&apos;s Connect</h3>
            <p className="mt-3 max-w-[340px] text-[15px] leading-relaxed text-white/70">
              Have something in mind? I&apos;d love to hear about it.
            </p>
            <Button
              href="#contact"
              variant="primary"
              size="lg"
              className={`group mt-5 rounded-2xl px-7 py-3.5 shadow-[0_8px_32px_rgb(var(--brand-deep-rgb)/0.55)] ${FOCUS}`}
            >
              <Mail className="size-4" aria-hidden />
              Send a Message
              <ArrowRight
                className="size-4 transition-transform duration-300 motion-safe:group-hover:translate-x-1"
                aria-hidden
              />
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
          className="bg-background/80 mt-8 grid items-center gap-3 rounded-xl border border-white/10 px-5 py-3.5 text-center sm:mt-10 md:grid-cols-[1fr_auto_1fr] md:gap-4 lg:mt-12"
        >
          <p className="order-2 text-[13px] text-white/60 md:order-none md:text-left md:text-[13.5px]">
            <span className="max-md:block">
              &copy; {year} Cristache Adrian. All rights reserved.
            </span>
            <span className="mx-1.5 text-white/30 max-md:hidden">|</span>
            <Link
              href="/privacy"
              className="underline-offset-4 transition-colors duration-200 hover:text-white hover:underline max-md:mt-1 max-md:block"
            >
              Privacy
            </Link>
          </p>
          <div className="hidden items-center justify-center gap-2.5 md:flex">
            <Workflow className="text-brand-mid size-5.5" aria-hidden />
            <span className="font-mono text-[11.5px] tracking-[0.28em] text-white/65">
              DIAGNOSE <span className="text-white/30">&times;</span> BUILD{" "}
              <span className="text-white/30">&times;</span> AUTOMATE
            </span>
          </div>
          <p className="order-1 font-mono text-[11.5px] tracking-[0.28em] text-white/65 uppercase md:order-none md:text-right">
            <span className="text-brand-bright">Crafted</span> with Purpose.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}

export default Footer;
