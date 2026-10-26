"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { m, useScroll, useSpring, useTransform } from "framer-motion";
import { MapPin } from "lucide-react";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { ProgressiveReveal } from "@/components/motion/ProgressiveReveal";
import { Section } from "@/components/ui/Section";
import { SectionBackdrop } from "./SectionBackdrop";
import labelCss from "@/components/ui/section-label.module.css";
import { cn } from "@/utils/cn";
import type { ExperienceRow } from "@/lib/queries";
import styles from "./experience-layout.module.css";
import subtitleCss from "./section-subtitle.module.css";
import spacing from "./experience-projects-spacing.module.css";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const TIMELINE_SPRING = { stiffness: 120, damping: 30, restDelta: 0.001 };

/** Share scroll progress across orientations; entry highlighting remains desktop-only. */
function ScrollTimelineRail({
  listRef,
  highlightEntries,
}: {
  listRef: RefObject<HTMLDivElement | null>;
  highlightEntries: boolean;
}) {
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start 70%", "end 60%"],
    trackContentSize: true,
  });
  const fill = useSpring(scrollYProgress, TIMELINE_SPRING);
  const scaleY = useTransform(fill, [0, 1], [0, 1]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const track = list.querySelector<HTMLElement>("[data-timeline-track]");
    if (!track) return;
    const dots = Array.from(list.querySelectorAll<HTMLElement>("[data-timeline-dot]"));
    let positions: number[] = [];
    let length = 0;
    const update = (progress: number) => {
      dots.forEach((dot, index) => {
        dot.toggleAttribute(
          "data-timeline-filled",
          progress > 0 && progress * length >= positions[index],
        );
      });
    };
    const measure = () => {
      const bounds = list.getBoundingClientRect();
      // Layout dimensions stay accurate when landscape changes the root font size.
      length = track.offsetHeight;
      const start = track.offsetTop;
      positions = dots.map((dot) => {
        const rect = dot.getBoundingClientRect();
        return Math.max(0, Math.min(length, rect.top + rect.height / 2 - bounds.top - start));
      });
      update(fill.get());
    };
    measure();
    const unsubscribe = fill.on("change", update);
    const resize = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : undefined;
    resize?.observe(list);
    window.addEventListener("resize", measure);
    return () => {
      unsubscribe();
      resize?.disconnect();
      window.removeEventListener("resize", measure);
      dots.forEach((dot) => dot.removeAttribute("data-timeline-filled"));
    };
  }, [fill, listRef]);

  useEffect(() => {
    const list = listRef.current;
    if (!highlightEntries || !list || typeof IntersectionObserver !== "function") return;
    const entries = Array.from(list.querySelectorAll<HTMLElement>("[data-experience-id]"));
    const visible = new Set<Element>();
    let observer: IntersectionObserver;
    let active = true;
    const connect = () => {
      observer?.disconnect();
      visible.clear();
      entries.forEach((entry) => entry.removeAttribute("data-timeline-active"));
      observer = new IntersectionObserver(
        (records) => {
          if (!active) return;
          for (const record of records) {
            if (record.isIntersecting) visible.add(record.target);
            else visible.delete(record.target);
          }
          const current = entries.find((entry) => visible.has(entry));
          entries.forEach((entry) => {
            if (entry === current) entry.setAttribute("data-timeline-active", "true");
            else entry.removeAttribute("data-timeline-active");
          });
        },
        {
          rootMargin: `-${Math.round(window.innerHeight * 0.25)}px 0px -${Math.round(window.innerHeight * 0.45)}px 0px`,
        },
      );
      entries.forEach((entry) => observer.observe(entry));
    };
    connect();
    window.addEventListener("resize", connect);
    return () => {
      active = false;
      observer.disconnect();
      window.removeEventListener("resize", connect);
      entries.forEach((entry) => entry.removeAttribute("data-timeline-active"));
    };
  }, [highlightEntries, listRef]);

  return (
    <m.span
      aria-hidden
      style={{ scaleY }}
      className={`${styles.rail} absolute top-6 bottom-6 w-px origin-top bg-(image:--gradient-brand)`}
    />
  );
}

function TimelineEntry({ exp, index, last }: { exp: ExperienceRow; index: number; last: boolean }) {
  const { mode } = useAnimationPolicy();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const previewCount = desktop ? 2 : 1;
  const [expanded, setExpanded] = useState(false);

  const inner = (
    <div className="flex gap-4 sm:gap-5">
      <div aria-hidden className="w-3 shrink-0" />

      {/* Card content */}
      <div className={cn("min-w-0 flex-1 pb-6 sm:pb-8", last && "pb-0")}>
        <div
          className={`${styles.card} bg-background/100 w-full rounded-2xl border border-(--brand-mid)/25 px-4 py-4 backdrop-blur-sm sm:px-5`}
        >
          <p className="font-mono text-xs leading-none tracking-[0.18em] text-(--period) uppercase">
            {exp.period}
          </p>
          <h3 className="mt-1.5 text-lg leading-snug font-bold sm:text-xl">{exp.role}</h3>
          <div
            className={`${styles.metadata} text-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm leading-snug`}
          >
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
              {exp.description.slice(0, previewCount).map((d, i) => (
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
          {exp.description.length > previewCount && (
            <details
              className="group mt-2"
              open={desktop || expanded}
              onToggle={(event) => {
                if (!desktop) setExpanded(event.currentTarget.open);
              }}
            >
              <summary
                className={`${styles.disclosure} text-brand-bright focus-visible:ring-brand-mid/70 flex min-h-[44px] cursor-pointer list-none items-center gap-2 rounded-lg text-sm font-medium focus-visible:ring-2 focus-visible:outline-none lg:hidden [&::-webkit-details-marker]:hidden`}
              >
                <span className="group-open:hidden">More details</span>
                <span className="hidden group-open:inline">Fewer details</span>
                <span
                  aria-hidden
                  className="transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                >
                  ⌄
                </span>
              </summary>
              <ul className="mt-1 space-y-2">
                {exp.description.slice(previewCount).map((d, i) => (
                  <li
                    key={`${exp.id}-more-${i}`}
                    className="text-muted flex gap-2.5 text-sm leading-relaxed"
                  >
                    <span
                      aria-hidden
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-(image:--gradient-brand)"
                    />
                    <span className="min-w-0 break-words">{d}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <li className={`${styles.entry} relative`} data-experience-id={exp.id}>
      <span
        aria-hidden
        data-timeline-dot
        className={`${styles.dot} ${styles.marker} bg-background absolute top-[1.125rem] z-10 size-3 rounded-full border-2 border-(--brand-deep) ring-4 ring-(--brand-deep)/15`}
      />
      <ProgressiveReveal
        effect={mode === "expressive" ? "slide" : "fade"}
        desktopDelay={Math.min(index * 0.04, 0.12)}
      >
        {inner}
      </ProgressiveReveal>
    </li>
  );
}

export function Experience({
  experiences,
  number = "03",
}: {
  experiences: ExperienceRow[];
  number?: string;
}) {
  const sorted = [...experiences].sort((a, b) => a.order - b.order);
  const { mode } = useAnimationPolicy();
  const listRef = useRef<HTMLDivElement>(null);

  return (
    <Section
      id="experience"
      className={`${styles.section} ${spacing.experience} scroll-mt-[80px] overflow-clip pt-2 md:scroll-mt-1 md:pt-28`}
      backdrop={
        <SectionBackdrop
          frame="desktop-screen"
          video="/media/experience.mp4"
          poster="/media/experience.webp"
          fetchPriority="low"
          deferUntilHeroLoaded
          deferUntilNearViewport
          responsivePoster={{
            srcSet:
              "/media/experience-640.webp 640w, /media/experience-960.webp 960w, /media/experience-1600.webp 1600w",
            aspectRatio: 16 / 9,
          }}
          scrim="bg-background/90 absolute inset-0"
        />
      }
    >
      {/* Two columns on lg+: sticky intro on the left, timeline on the right,
          both inside the shared page width so the block does not drift left
          on a wide monitor. Stacks to one column below lg. */}
      <div className="grid w-full items-start gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-14 [@media(orientation:landscape)_and_(max-height:500px)]:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] [@media(orientation:landscape)_and_(max-height:500px)]:gap-8">
        <div className="relative min-w-0 lg:sticky lg:top-24 lg:z-10 lg:self-start [@media(orientation:landscape)_and_(max-height:500px)]:sticky [@media(orientation:landscape)_and_(max-height:500px)]:top-20 [@media(orientation:landscape)_and_(max-height:500px)]:z-10 [@media(orientation:landscape)_and_(max-height:500px)]:self-start">
          <ProgressiveReveal effect="fade" className="mb-5">
            <p className={labelCss.label}>
              <span className={labelCss.number}>{number}</span>
              <span>Experience</span>
              <span aria-hidden className={labelCss.rule} />
            </p>
            <h2 className="font-display text-[clamp(1.65rem,3.4vw,3.5rem)] leading-[1.05] font-extrabold tracking-tight whitespace-nowrap">
              Where I&apos;ve <span className="gradient-text">worked</span>
            </h2>
          </ProgressiveReveal>
          <ProgressiveReveal effect="slide" desktopDelay={0.08}>
            <p className={`${subtitleCss.subtitle} max-w-md`}>
              Enterprise deployments, infrastructure operations and automation across international
              restaurant locations.
            </p>
          </ProgressiveReveal>
        </div>

        <div ref={listRef} className="relative">
          {/* Connector rail: faint track + a gradient fill that grows on scroll.
              Sits under the entry dots (which are z-10). */}
          {sorted.length > 0 && (
            <>
              <span
                aria-hidden
                data-timeline-track
                className={`${styles.rail} bg-border absolute top-6 bottom-6 w-px`}
              />
              <span
                aria-hidden
                className={`${styles.rail} absolute top-6 bottom-6 w-px bg-(image:--gradient-brand) opacity-30`}
              />
              {sorted.length > 1 && mode !== "static" && (
                <ScrollTimelineRail listRef={listRef} highlightEntries={mode === "expressive"} />
              )}
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
          {sorted.length > 0 && (
            <span
              aria-hidden
              data-timeline-dot
              data-timeline-end
              className={`${styles.dot} ${styles.marker} bg-background absolute bottom-[1.125rem] z-10 size-3 rounded-full border-2 border-(--brand-deep) ring-4 ring-(--brand-deep)/15`}
            />
          )}
        </div>
      </div>
    </Section>
  );
}

export default Experience;
