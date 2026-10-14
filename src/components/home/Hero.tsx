"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Magnetic } from "@/components/motion/Magnetic";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export type HeroProfile = {
  name: string;
  roles: string[];
};

const EASE = [0.22, 1, 0.36, 1] as const;
const HERO_COPY =
  "I design and build modern digital solutions that combine technology, usability, and long-term thinking. From web and mobile applications to IT systems and automation, every project is crafted with purpose.";

/** Entrance helper: fade-up at a choreographed delay. */
function fadeUp(reduce: boolean, delay: number) {
  return {
    initial: reduce ? false : ({ opacity: 0, y: 22 } as const),
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: EASE, delay },
  };
}

/**
 * Two-column opening: the headline and actions on the left, the official
 * monogram on the right. Stacks on small screens. Accents follow the palette.
 */
export function Hero({
  profile,
  sponsorUrl,
  heroTagline,
}: {
  profile: HeroProfile;
  sponsorUrl?: string;
  heroTagline?: string | null;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 80]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0]);

  return (
    <section
      id="hero"
      ref={ref}
      className="relative flex min-h-svh scroll-mt-24 flex-col justify-center overflow-hidden"
    >
      <div aria-hidden className="hero-scrim pointer-events-none absolute inset-0" />

      <motion.div
        style={{ y, opacity }}
        className="site-container relative grid items-center gap-12 py-28 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:py-32"
      >
        <div>
          <p className="sr-only">{profile.name}</p>
          <motion.p
            {...fadeUp(reduce, 0.2)}
            className="text-muted font-mono text-[11px] tracking-[0.22em] uppercase"
          >
            Independent developer &amp; IT specialist
          </motion.p>

          {heroTagline && (
            <motion.p {...fadeUp(reduce, 0.35)} className="mt-4">
              <span className="border-border bg-surface text-muted inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[9px] tracking-[0.18em] uppercase backdrop-blur-sm sm:text-[10px]">
                <span
                  aria-hidden
                  className="size-1.5 animate-pulse rounded-full bg-(image:--gradient-brand) shadow-[0_0_8px_2px_rgb(var(--brand-deep-rgb)/0.6)] motion-reduce:animate-none"
                />
                {heroTagline}
              </span>
            </motion.p>
          )}

          <h1 className="mt-5 max-w-xl text-[clamp(40px,6vw,72px)] leading-[0.98] font-semibold tracking-tight">
            <motion.span
              initial={reduce ? false : { y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.4 }}
              className="block"
            >
              Technology, built with <span className="text-(--brand-mid)">intention.</span>
            </motion.span>
          </h1>

          <motion.p
            {...fadeUp(reduce, 0.7)}
            className="text-muted mt-6 max-w-xl text-base leading-relaxed sm:text-lg"
          >
            {HERO_COPY}
          </motion.p>

          {profile.roles.length > 0 && (
            <motion.p
              {...fadeUp(reduce, 0.85)}
              className="text-muted mt-4 font-mono text-xs tracking-[0.14em] uppercase"
            >
              {profile.roles.join(" / ")}
            </motion.p>
          )}

          <motion.div {...fadeUp(reduce, 1)} className="mt-8 flex flex-wrap gap-4">
            <Magnetic>
              <Button variant="primary" size="lg" href="#projects">
                Explore Projects <ArrowRight className="size-4" aria-hidden />
              </Button>
            </Magnetic>
            <Magnetic>
              <Button variant="secondary" size="lg" href="#contact">
                Get in Touch
              </Button>
            </Magnetic>
            {sponsorUrl && (
              <Magnetic>
                <Button
                  variant="secondary"
                  size="lg"
                  href={sponsorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  leftIcon={<Heart className="size-4" aria-hidden />}
                >
                  Sponsor
                </Button>
              </Magnetic>
            )}
          </motion.div>
        </div>

        <motion.div
          {...fadeUp(reduce, 0.55)}
          className="relative mx-auto aspect-square w-full max-w-[440px] rounded-full bg-[#080c0d] dark:bg-transparent"
        >
          <div
            aria-hidden
            className="absolute inset-[6%] rounded-full border border-(--brand-mid)/25"
          />
          <div
            aria-hidden
            className="absolute inset-[16%] rounded-full border border-(--brand-mid)/15"
          />
          <div
            aria-hidden
            className="absolute inset-[26%] rounded-full border border-(--brand-mid)/10"
          />
          <Image
            src="/brand/aristache-monogram.png"
            alt=""
            width={1359}
            height={1157}
            priority
            className="relative z-10 h-full w-full object-contain"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

export default Hero;
