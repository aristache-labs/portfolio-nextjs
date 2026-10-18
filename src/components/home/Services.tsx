"use client";

import { motion } from "framer-motion";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { REDUCED_MOTION_PROPS, useReducedMotion } from "@/hooks/useReducedMotion";
import { ServiceCard } from "./ServiceCard";
import { SectionBackdrop } from "./SectionBackdrop";
import type { Service } from "@/db/schema";

export type ServiceRow = Service;

const EASE = [0.22, 1, 0.36, 1] as const;

/** Scroll-in props shared with Skills and Contact; immediately visible when motion is reduced. */
function rise(reduce: boolean, y: number, duration: number, delay = 0) {
  if (reduce) return REDUCED_MOTION_PROPS;
  return {
    initial: { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration, delay, ease: EASE },
  };
}

export function Services({ services }: { services: ServiceRow[] }) {
  const sorted = [...services].sort((a, b) => a.order - b.order);
  const reduce = useReducedMotion();

  return (
    <Section
      id="services"
      className="scroll-mt-24 pt-6 pb-4 md:pt-12 md:pb-6"
      backdrop={
        <>
          <SectionBackdrop
            video="/media/about.mp4"
            poster="/media/about.webp"
            deferUntilHeroLoaded
          />
          <div
            aria-hidden
            className="bg-background/70 pointer-events-none absolute inset-0 z-[1]"
          />
        </>
      }
    >
      <div className="mb-4">
        <motion.p
          {...rise(reduce, 16, 0.6)}
          className="text-muted mb-4 flex items-center gap-4 font-mono text-xs tracking-[0.3em] uppercase"
        >
          <span>
            <span className="gradient-text mr-3 font-semibold">05</span>
            Services
          </span>
          <span aria-hidden className="bg-border h-px flex-1" />
        </motion.p>
        <motion.h2
          {...rise(reduce, 28, 0.8, 0.1)}
          className="font-display text-[clamp(1.65rem,3.4vw,3.5rem)] leading-[1.05] font-extrabold tracking-tight"
        >
          What I <span className="gradient-text">do</span>
        </motion.h2>
      </div>
      <motion.p
        {...rise(reduce, 18, 0.7, 0.18)}
        className="text-muted mb-10 max-w-2xl text-sm leading-relaxed text-pretty md:text-base"
      >
        From enterprise infrastructure to modern applications - delivering reliable solutions
        through engineering, automation, and innovation.
      </motion.p>

      {sorted.length === 0 ? (
        <motion.div {...rise(reduce, 28, 0.55)}>
          <Card className="flex items-center justify-center py-12 text-center">
            <p className="text-muted text-sm">No services listed yet.</p>
          </Card>
        </motion.div>
      ) : (
        <div className="grid items-stretch gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {sorted.map((s, i) => (
            <motion.div
              key={s.title}
              {...(reduce
                ? REDUCED_MOTION_PROPS
                : {
                    initial: { opacity: 0, y: 28, scale: 0.98 },
                    whileInView: { opacity: 1, y: 0, scale: 1 },
                    viewport: { once: true, margin: "-40px" },
                    transition: { duration: 0.55, delay: Math.min(i * 0.08, 0.4), ease: EASE },
                    whileHover: { y: -4 },
                  })}
              className="h-full"
            >
              <ServiceCard service={s} index={i} />
            </motion.div>
          ))}
        </div>
      )}
    </Section>
  );
}

export default Services;
