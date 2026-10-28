"use client";

import { m } from "framer-motion";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { REDUCED_MOTION_PROPS, useReducedMotion } from "@/hooks/useReducedMotion";
import { ServiceCard } from "./ServiceCard";
import { SectionBackdrop } from "./SectionBackdrop";
import labelCss from "@/components/ui/section-label.module.css";
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

export function Services({ services, number = "05" }: { services: ServiceRow[]; number?: string }) {
  const sorted = [...services].sort((a, b) => a.order - b.order || a.id - b.id).slice(0, 4);
  const reduce = useReducedMotion();

  return (
    <Section
      id="services"
      className="scroll-mt-[80px] pt-6 pb-4 md:pt-12 md:pb-6"
      backdrop={
        <>
          <SectionBackdrop
            video="/media/about-v3.mp4"
            poster="/media/about.webp"
            deferUntilHeroLoaded
          />
          <div
            aria-hidden
            className="bg-background/70 md:bg-background/80 pointer-events-none absolute inset-0 z-[1]"
          />
        </>
      }
    >
      <div className="mb-5">
        <m.p {...rise(reduce, 16, 0.6)} className={labelCss.label}>
          <span className={labelCss.number}>{number}</span>
          <span>Services</span>
          <span aria-hidden className={labelCss.rule} />
        </m.p>
        <m.h2
          {...rise(reduce, 28, 0.8, 0.1)}
          className="font-display text-[clamp(1.65rem,2.8vw,2.5rem)] leading-[1.05] font-extrabold tracking-tight"
        >
          What I <span className="gradient-text">do</span>
        </m.h2>
      </div>
      {sorted.length === 0 ? (
        <m.div {...rise(reduce, 28, 0.55)}>
          <Card className="flex items-center justify-center py-12 text-center">
            <p className="text-muted text-sm">No services listed yet.</p>
          </Card>
        </m.div>
      ) : (
        <div className="grid items-stretch gap-3 md:grid-cols-2 2xl:grid-cols-4">
          {sorted.map((s, i) => (
            <m.div
              key={s.id}
              {...(reduce
                ? REDUCED_MOTION_PROPS
                : {
                    initial: { opacity: 0, y: 12 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true, margin: "-40px" },
                    transition: { duration: 0.55, delay: Math.min(i * 0.08, 0.4), ease: EASE },
                  })}
              className="h-full"
            >
              <ServiceCard service={s} />
            </m.div>
          ))}
        </div>
      )}
    </Section>
  );
}

export default Services;
