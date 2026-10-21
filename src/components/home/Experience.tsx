"use client";

import { useRef } from "react";
import { m, useScroll, useSpring, useTransform } from "framer-motion";
import { MapPin } from "lucide-react";
import { REDUCED_MOTION_PROPS, useReducedMotion } from "@/hooks/useReducedMotion";
import { Section } from "@/components/ui/Section";
import { SectionBackdrop } from "./SectionBackdrop";
import { cn } from "@/utils/cn";
import type { ExperienceRow } from "@/lib/queries";

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

function TimelineEntry({ exp, index, last }: { exp: ExperienceRow; index: number; last: boolean }) {
  const reduce = useReducedMotion();

  const inner = (
    <div className="flex gap-4 sm:gap-5">
      {/* Rail dot (the connector line is drawn once for the whole list) */}
      <div className="relative flex w-3 shrink-0 justify-center">
        <span className="bg-background z-10 mt-[18px] size-3 shrink-0 rounded-full border-2 border-(--brand-deep) ring-4 ring-(--brand-deep)/15" />
      </div>

      {/* Card content */}
      <div className={cn("min-w-0 flex-1 pb-6 sm:pb-8", last && "pb-0")}>
        <div className="bg-background/100 w-full rounded-2xl border border-(--brand-mid)/25 px-4 py-4 backdrop-blur-sm sm:px-5">
          <p className="font-mono text-xs leading-none tracking-[0.18em] text-(--period) uppercase">
            {exp.period}
          </p>
          <h3 className="mt-1.5 text-lg leading-snug font-bold sm:text-xl">{exp.role}</h3>
          <div className="text-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm leading-snug">
            <span>{exp.org}</span>
            {exp.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3 shrink-0" aria-hidden />
                {exp.location}
              </span>
            )}
          </div>
          {exp.description.length > 0 && (
            <ul className="mt-3.5 space-y-2">
              {exp.description.map((d, i) => (
                <li
                  key={`${exp.id}-bullet-${i}`}
                  className="text-muted flex gap-2.5 text-sm leading-relaxed"
                >
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-(image:--gradient-brand)" />
                  <span className="min-w-0 break-words">{d}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  if (reduce) {
    return <li>{inner}</li>;
  }

  return (
    <m.li
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: Math.min(index * 0.08, 0.4), ease: EASE }}
      whileHover={{ y: -4 }}
    >
      {inner}
    </m.li>
  );
}

export function Experience({ experiences }: { experiences: ExperienceRow[] }) {
  const sorted = [...experiences].sort((a, b) => a.order - b.order);
  const reduce = useReducedMotion();
  const listRef = useRef<HTMLDivElement>(null);

  // Track scroll through the list and fill the connector rail as it passes.
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start 70%", "end 60%"],
  });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  const scaleY = useTransform(fill, [0, 1], [0, 1]);

  return (
    <Section
      id="experience"
      className="scroll-mt-24 overflow-clip pt-2 md:scroll-mt-1 md:pt-28"
      backdrop={
        <SectionBackdrop
          video="/media/experience.mp4"
          poster="/media/experience.webp"
          scrim="bg-background/80 absolute inset-0 md:bg-background/70"
        />
      }
    >
      {/* Two columns on lg+: sticky intro on the left, timeline on the right,
          both inside the shared page width so the block does not drift left
          on a wide monitor. Stacks to one column below lg. */}
      <div className="grid w-full items-start gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-14">
        <div className="relative min-w-0 lg:sticky lg:top-24 lg:z-10 lg:self-start">
          <div className="mb-5">
            <m.p
              {...rise(reduce, 16, 0.6)}
              className="text-muted mb-4 flex items-center gap-4 font-mono text-xs tracking-[0.3em] uppercase"
            >
              <span>
                <span className="gradient-text mr-3 font-semibold">03</span>
                Experience
              </span>
              <span aria-hidden className="bg-border h-px flex-1" />
            </m.p>
            <m.h2
              {...rise(reduce, 28, 0.8, 0.1)}
              className="font-display text-[clamp(1.65rem,3.4vw,3.5rem)] leading-[1.05] font-extrabold tracking-tight whitespace-nowrap"
            >
              Where I&apos;ve <span className="gradient-text">worked</span>
            </m.h2>
          </div>
          <m.p
            {...rise(reduce, 18, 0.7, 0.18)}
            className="text-muted max-w-md text-base leading-relaxed text-white/80 sm:text-lg"
          >
            From hands-on IT support to leading global enterprise deployments, my journey is built
            on solving complex challenges, automating workflows, and delivering reliable technology
            solutions.
          </m.p>
        </div>

        <div ref={listRef} className="relative">
          {/* Connector rail: faint track + a gradient fill that grows on scroll.
              Sits under the entry dots (which are z-10). */}
          {sorted.length > 1 && (
            <>
              <span aria-hidden className="bg-border absolute top-6 bottom-6 left-[5.5px] w-px" />
              <m.span
                aria-hidden
                style={reduce ? { transform: "scaleY(1)" } : { scaleY }}
                className="absolute top-6 bottom-6 left-[5.5px] w-px origin-top bg-(image:--gradient-brand)"
              />
            </>
          )}
          <ol className="relative">
            {sorted.map((exp, index) => (
              <TimelineEntry
                key={exp.id}
                exp={exp}
                index={index}
                last={index === sorted.length - 1}
              />
            ))}
          </ol>
        </div>
      </div>
    </Section>
  );
}

export default Experience;
