"use client";

import { motion } from "framer-motion";
import { Activity, ArrowRight, ArrowUpRight, Mail, Sparkle } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { platformIcon, type SocialRow } from "@/components/home/social-icons";
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

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.65, delay, ease: EASE },
});

export function Footer({ socials }: { socials: SocialRow[] }) {
  const sorted = [...socials].sort((a, b) => a.order - b.order);
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden">
      <SectionBackdrop poster="/media/footer.webp" scrim="bg-background/75 absolute inset-0" />
      <div
        aria-hidden
        className="from-background/80 via-background/25 to-background/55 pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b"
      />

      <div className="site-container relative z-10 pt-14 pb-8 lg:pt-16">
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
            className="font-display mt-6 text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.1] font-extrabold tracking-tight text-white"
          >
            Thanks for <span className="gradient-text">visiting.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.18 }}
            className="mt-4 max-w-[580px] text-[16.5px] leading-[1.6] text-white/70 sm:text-[17px]"
          >
            Open to projects, collaborations, and problems worth solving.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scaleX: 0.85 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.26, ease: EASE }}
            className="mt-8 flex w-full max-w-[620px] items-center gap-4"
          >
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/25" />
            <Sparkle className="fill-brand-mid text-brand-bright size-4 shrink-0 drop-shadow-[0_0_8px_rgb(var(--brand-mid-rgb)/0.8)]" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/25" />
          </motion.div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-y-10 sm:grid-cols-2 lg:mt-10 lg:grid-cols-[1.5fr_1fr_1fr_1.15fr] lg:gap-x-10">
          <motion.div {...rise(0.05)} className="min-w-0">
            <Link href="#hero" aria-label="Back to top">
              <Logo />
            </Link>
            <p className="mt-3.5 max-w-[290px] text-[15px] leading-relaxed text-white/60">
              Diagnose. Build. Automate.
            </p>
            {sorted.length > 0 && (
              <ul className="mt-6 flex gap-3">
                {sorted.map((social) => {
                  const Icon = platformIcon(social.platform);
                  const external = social.url.startsWith("http");
                  return (
                    <li key={social.platform}>
                      <a
                        href={social.url}
                        aria-label={social.platform}
                        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className="hover:border-brand-mid/50 hover:bg-brand-mid/10 grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_20px_rgb(var(--brand-mid-rgb)/0.3)]"
                      >
                        <Icon className="text-brand-bright size-[18px]" aria-hidden />
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>

          <motion.div {...rise(0.12)} className={DIVIDER}>
            <h3 className="font-display text-[17px] font-semibold text-white">Quick Links</h3>
            <ul className="mt-4 space-y-2.5">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="group flex items-center justify-between gap-6 py-0.5 text-[15px] text-white/65 transition-colors hover:text-white"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="text-brand-mid group-hover:text-brand-bright size-4 shrink-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div {...rise(0.19)} className={DIVIDER}>
            <h3 className="font-display text-[17px] font-semibold text-white">Other Places</h3>
            <ul className="mt-4 space-y-2.5">
              {sorted.map((social) => {
                const external = social.url.startsWith("http");
                return (
                  <li key={social.platform}>
                    <a
                      href={social.url}
                      aria-label={`${social.platform} profile`}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="group flex items-center justify-between gap-6 py-0.5 text-[15px] text-white/65 capitalize transition-colors hover:text-white"
                    >
                      <span>{social.platform}</span>
                      <ArrowUpRight className="text-brand-mid group-hover:text-brand-bright size-4 shrink-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </motion.div>

          <motion.div {...rise(0.26)} className={DIVIDER}>
            <h3 className="font-display text-[17px] font-semibold text-white">
              Let&apos;s Connect
            </h3>
            <p className="mt-3 max-w-[280px] text-[15px] leading-relaxed text-white/60">
              The contact section is the fastest way to reach me.
            </p>
            <Button
              href="#contact"
              variant="primary"
              size="lg"
              className="group mt-5 rounded-2xl px-7 py-3.5 shadow-[0_8px_32px_rgb(var(--brand-deep-rgb)/0.55)]"
            >
              <Mail className="size-4" aria-hidden />
              Send a Message
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
          className="bg-background/70 mt-10 flex flex-col items-center gap-2.5 rounded-xl border border-white/10 px-5 py-3.5 backdrop-blur-md sm:flex-row sm:justify-between sm:gap-4 lg:mt-14"
        >
          <p className="text-center text-[13.5px] text-white/55 sm:text-left">
            &copy; {year} Cristache Adrian. All rights reserved.
          </p>
          <div className="hidden items-center gap-2.5 md:flex">
            <Activity className="text-brand-mid size-3.5" aria-hidden />
            <span className="font-mono text-[11.5px] tracking-[0.28em] text-white/60">
              DIAGNOSE <span className="text-white/30">x</span> BUILD{" "}
              <span className="text-white/30">x</span> AUTOMATE
            </span>
          </div>
          <p className="text-center text-[13.5px] text-white/55">Based in Romania</p>
        </motion.div>
      </div>
    </footer>
  );
}

export default Footer;
