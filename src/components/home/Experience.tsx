"use client";

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { AnimatePresence, m, useScroll } from "framer-motion";
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
import headingCss from "./mobile-section-heading.module.css";
import spacing from "./experience-projects-spacing.module.css";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  EXPERIENCE_LANDSCAPE_QUERY,
  EXPERIENCE_PORTRAIT_QUERY,
  ExperienceMobileReveal,
} from "./ExperienceMobileReveal";

/** Keep frame-based content measurements local to the visible timeline. */
function NearbyTimelineRail({
  listRef,
  highlightEntries,
  trackCurrent,
  onActive,
}: {
  listRef: RefObject<HTMLDivElement | null>;
  highlightEntries: boolean;
  trackCurrent: boolean;
  onActive: (index: number) => void;
}) {
  const [near, setNear] = useState(() => typeof IntersectionObserver !== "function");

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (typeof IntersectionObserver !== "function") return;
    let active = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (active && entry) setNear(entry.isIntersecting);
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(list);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [listRef]);

  return near ? (
    <ScrollTimelineRail
      listRef={listRef}
      highlightEntries={highlightEntries}
      trackCurrent={trackCurrent}
      onActive={onActive}
    />
  ) : null;
}

/** Share scroll progress; desktop entrances and the current-role tracker stay independent. */
function ScrollTimelineRail({
  listRef,
  highlightEntries,
  trackCurrent,
  onActive,
}: {
  listRef: RefObject<HTMLDivElement | null>;
  highlightEntries: boolean;
  trackCurrent: boolean;
  /** Reports the role in the central band, for the indicator beside the heading. */
  onActive: (index: number) => void;
}) {
  // The rail follows scrolling directly, so a role enters exactly when the line reaches it.
  const { scrollYProgress: fill } = useScroll({
    target: listRef,
    offset: ["start 70%", "end 60%"],
    trackContentSize: true,
  });

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const track = list.querySelector<HTMLElement>("[data-timeline-track]");
    if (!track) return;
    const dots = Array.from(list.querySelectorAll<HTMLElement>("[data-timeline-dot]"));
    const entries = Array.from(list.querySelectorAll<HTMLElement>("[data-experience-id]"));
    if (highlightEntries) list.setAttribute("data-timeline-scroll", "");
    let positions: number[] = [];
    let length = 0;
    const update = (progress: number) => {
      dots.forEach((dot, index) => {
        dot.toggleAttribute(
          "data-timeline-filled",
          progress > 0 && progress * length >= positions[index],
        );
      });
      if (!highlightEntries || progress <= 0) return;
      // A role enters slightly ahead of the rail, which then lights its marker. One way:
      // a role that has entered stays visible when scrolling back up.
      const lead = innerHeight * 0.3;
      entries.forEach((entry, index) => {
        if (progress * length + lead >= positions[index]) entry.setAttribute("data-entered", "");
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
      // Entered roles keep their state; without this attribute nothing is hidden anyway.
      list.removeAttribute("data-timeline-scroll");
    };
  }, [fill, highlightEntries, listRef]);

  useEffect(() => {
    const list = listRef.current;
    if ((!highlightEntries && !trackCurrent) || !list || typeof IntersectionObserver !== "function")
      return;
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
          // Between roles the indicator keeps the last one rather than going blank.
          if (current) onActive(entries.indexOf(current));
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
  }, [highlightEntries, trackCurrent, listRef, onActive]);

  return (
    <m.span
      aria-hidden
      style={{ scaleY: fill }}
      className={`${styles.rail} absolute top-6 bottom-6 w-px origin-top bg-(image:--gradient-brand)`}
    />
  );
}

/** Sticky offset of the intro column (lg:top-24). */
const INTRO_TOP = 96;

/** Order of a card part in its staggered entrance. */
const step = (order: number) => ({ "--step": order }) as CSSProperties;

function TimelineEntry({ exp, index, last }: { exp: ExperienceRow; index: number; last: boolean }) {
  const { mode } = useAnimationPolicy();
  const portrait = useMediaQuery(EXPERIENCE_PORTRAIT_QUERY);
  const landscape = useMediaQuery(EXPERIENCE_LANDSCAPE_QUERY);
  const desktop = useMediaQuery("(min-width: 1024px)");
  const previewCount = desktop ? 2 : 1;
  const [expanded, setExpanded] = useState(false);

  const inner = (
    <div className="flex gap-4 sm:gap-5">
      <div aria-hidden className="w-3 shrink-0" />

      {/* Card content */}
      <div className={cn("min-w-0 flex-1 pb-4 sm:pb-5", last && "pb-0")}>
        <div
          className={`${styles.card} w-full rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgb(255_255_255/0.045),rgb(255_255_255/0.01))] px-4 py-3.5 backdrop-blur-[18px] sm:px-5`}
        >
          <p
            className={`${styles.step} font-mono text-xs leading-none tracking-[0.18em] text-(--period) uppercase`}
            style={step(0)}
          >
            {exp.period}
          </p>
          <h3
            className={`${styles.step} mt-1.5 text-lg leading-snug font-semibold sm:text-xl`}
            style={step(1)}
          >
            {exp.role}
          </h3>
          <div
            style={step(2)}
            className={`${styles.metadata} ${styles.step} text-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm leading-snug`}
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
            <ul className="mt-3 space-y-1.5">
              {exp.description.slice(0, previewCount).map((d, i) => (
                <li
                  key={`${exp.id}-bullet-${i}`}
                  style={step(3 + i)}
                  className={`${styles.step} text-muted flex gap-2.5 text-sm leading-[1.55]`}
                >
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-(image:--gradient-brand)" />
                  <span className="min-w-0 break-words">{d}</span>
                </li>
              ))}
            </ul>
          )}
          {exp.description.length > previewCount && (
            <details
              className="group mt-1.5"
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
              {/* On desktop the summary is hidden, so the list continues at the same rhythm. */}
              <ul className="mt-1.5 space-y-1.5 lg:mt-0">
                {exp.description.slice(previewCount).map((d, i) => (
                  <li
                    key={`${exp.id}-more-${i}`}
                    style={step(3 + previewCount + i)}
                    className={`${styles.step} text-muted flex gap-2.5 text-sm leading-[1.55]`}
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
      {portrait || landscape ? (
        <ExperienceMobileReveal kind="entry">{inner}</ExperienceMobileReveal>
      ) : mode === "expressive" ? (
        // The timeline rail reveals this role when it reaches the marker.
        inner
      ) : (
        <ProgressiveReveal effect="fade" desktopDelay={Math.min(index * 0.04, 0.12)}>
          {inner}
        </ProgressiveReveal>
      )}
    </li>
  );
}

/** Companion to the timeline: the role in view, kept beside the sticky heading. */
function CurrentRole({ experiences, active }: { experiences: ExperienceRow[]; active: number }) {
  const index = Math.min(active, experiences.length - 1);
  const role = experiences[index];
  const count = (value: number) => String(value).padStart(2, "0");
  return (
    // The same details are in the timeline itself, so assistive technology skips this copy.
    <div aria-hidden data-current-role className={`${styles.currentRole} hidden max-w-xs lg:block`}>
      <p className="text-muted font-mono text-[11px] tracking-[0.18em]">
        {count(index + 1)} / {count(experiences.length)}
      </p>
      <span className="mt-2 block h-px w-full overflow-hidden bg-white/10">
        <span
          className="block h-full origin-left bg-(image:--gradient-brand) transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `scaleX(${(index + 1) / experiences.length})` }}
        />
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={role.id}
          className="mt-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="font-mono text-xs tracking-[0.18em] text-(--period) uppercase">
            {role.period}
          </p>
          <p className="text-foreground/80 mt-1.5 text-sm">{role.org}</p>
        </m.div>
      </AnimatePresence>
    </div>
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
  const portrait = useMediaQuery(EXPERIENCE_PORTRAIT_QUERY);
  const landscape = useMediaQuery(EXPERIENCE_LANDSCAPE_QUERY);
  const HeadingReveal = portrait || landscape ? ExperienceMobileReveal : ProgressiveReveal;
  const listRef = useRef<HTMLDivElement>(null);
  const stickStart = useRef<HTMLSpanElement>(null);
  const [activeRole, setActiveRole] = useState(0);
  const [stuck, setStuck] = useState(false);
  // While the intro sticks beside the timeline, the subtitle folds and the indicator rises.
  const folds = (mode === "expressive" || (landscape && mode !== "static")) && sorted.length > 1;
  const compact = folds && stuck;
  const introTop = landscape ? 80 : INTRO_TOP;

  useEffect(() => {
    const marker = stickStart.current;
    if (!folds || !marker || typeof IntersectionObserver !== "function") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setStuck(!entry.isIntersecting && entry.boundingClientRect.top < introTop);
      },
      { rootMargin: `-${introTop}px 0px 0px 0px` },
    );
    observer.observe(marker);
    return () => observer.disconnect();
  }, [folds, introTop]);

  return (
    <Section
      id="experience"
      className={`${styles.section} ${spacing.experience} scroll-mt-[80px] overflow-clip pt-2 md:scroll-mt-1 md:pt-28`}
      backdrop={
        <SectionBackdrop
          frame="desktop-screen"
          video="/media/experience-v3.mp4"
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
      <div className="relative grid w-full items-start gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-14 [@media(orientation:landscape)_and_(max-height:500px)]:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] [@media(orientation:landscape)_and_(max-height:500px)]:gap-8">
        {/* Marks where the intro starts sticking (lg:top-24, matching INTRO_TOP). */}
        <span
          ref={stickStart}
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 h-px w-px"
        />
        <div
          data-compact={compact ? "" : undefined}
          className={`${styles.intro} relative min-w-0 lg:sticky lg:top-24 lg:z-10 lg:self-start [@media(orientation:landscape)_and_(max-height:500px)]:sticky [@media(orientation:landscape)_and_(max-height:500px)]:top-20 [@media(orientation:landscape)_and_(max-height:500px)]:z-10 [@media(orientation:landscape)_and_(max-height:500px)]:self-start`}
        >
          <HeadingReveal kind="title" effect="fade" className="mb-5">
            <p className={`${labelCss.label} ${headingCss.label}`}>
              <span className={labelCss.number}>{number}</span>
              <span>Experience</span>
              <span aria-hidden className={labelCss.rule} />
            </p>
            {/* Same scale and weight as the About and Skills headings. */}
            <h2
              className={`${headingCss.title} font-display text-[clamp(1.625rem,2.4vw,2rem)] leading-[1.15] font-medium tracking-[-0.035em] whitespace-nowrap`}
            >
              Where I&apos;ve <span className={`${headingCss.accent} text-brand-mid`}>worked</span>
            </h2>
          </HeadingReveal>
          <div className={styles.subtitleFold}>
            <div>
              <HeadingReveal kind="description" effect="slide" desktopDelay={0.08}>
                <p className={`${subtitleCss.subtitle} max-w-md`}>
                  Enterprise deployments, infrastructure operations and automation across
                  international restaurant locations.
                </p>
              </HeadingReveal>
            </div>
          </div>
          {folds && <CurrentRole experiences={sorted} active={activeRole} />}
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
                <NearbyTimelineRail
                  listRef={listRef}
                  highlightEntries={mode === "expressive"}
                  trackCurrent={portrait || landscape}
                  onActive={setActiveRole}
                />
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
