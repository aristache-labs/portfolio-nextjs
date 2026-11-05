"use client";

import { useEffect, useLayoutEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { useMobileSectionReset } from "@/hooks/useMobileSectionReset";
import { PINNED_SCENE_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import { ProgressiveReveal } from "@/components/motion/ProgressiveReveal";
import { Quote } from "lucide-react";
import { SkillCard, skillPercent } from "./SkillCard";
import { SkillEntrance } from "./SkillEntrance";
import { SkillSlot, SkillsScene } from "./SkillsSequence";
import { SectionBackdrop } from "./SectionBackdrop";
import responsiveCss from "./skills-responsive.module.css";
import labelCss from "@/components/ui/section-label.module.css";
import subtitleCss from "./section-subtitle.module.css";
import headingCss from "./section-heading.module.css";
import portraitCss from "@/components/ui/portrait-card-surface.module.css";
import {
  SKILLS_MOBILE_LANDSCAPE,
  SKILLS_MOBILE_PORTRAIT,
  SkillsMobileReveal,
} from "./SkillsMobileReveal";

export type SkillRow = {
  name: string;
  iconPath: string;
  category: string;
  order: number;
  level?: string | null;
};

const MOST_USED = "Most Used";
/** Homepage filter order. Tabs still appear only when a skill uses that category. */
const CATEGORY_ORDER = ["Development", "Infrastructure", "Automation", "Data & Cloud"];
/** Desktop has three rows; touch keeps the compact eight-skill selection. */
const MOST_USED_LIMIT = 8;
const DESKTOP_MOST_USED_LIMIT = 12;
const GRID = `${responsiveCss.grid} mt-4 grid min-w-0 grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4 [@media(orientation:landscape)_and_(max-width:1023px)_and_(max-height:500px)]:mx-auto [@media(orientation:landscape)_and_(max-width:1023px)_and_(max-height:500px)]:max-w-[640px]`;

function byOrder(skills: SkillRow[]) {
  return [...skills].sort((a, b) => a.order - b.order);
}

/** Highest levels first; admin order breaks ties. Missing levels follow rated skills. */
function mostUsedSkills(skills: SkillRow[], limit: number) {
  return [...skills]
    .sort(
      (a, b) => (skillPercent(b.level) ?? -1) - (skillPercent(a.level) ?? -1) || a.order - b.order,
    )
    .slice(0, limit);
}

export function Skills({ skills, number = "02" }: { skills: SkillRow[]; number?: string }) {
  const { mode } = useAnimationPolicy();
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const tabsId = useId();
  const tabsRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const previousPill = useRef<DOMRect | null>(null);
  const [iconsNear, setIconsNear] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setIconsNear(true));
      return () => cancelAnimationFrame(frame);
    }
    // Native lazy loading can fetch offscreen icons while the hero is still loading.
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setIconsNear(true);
        observer.disconnect();
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const ordered = useMemo(() => byOrder(skills), [skills]);
  const categories = useMemo(() => {
    const present = new Set(ordered.map((skill) => skill.category));
    const known = CATEGORY_ORDER.filter((category) => present.has(category));
    const extras: string[] = [];
    for (const skill of ordered) {
      if (CATEGORY_ORDER.includes(skill.category) || extras.includes(skill.category)) continue;
      extras.push(skill.category);
    }
    return [...known, ...extras];
  }, [ordered]);

  const [filter, setFilter] = useState(MOST_USED);
  const [hasFiltered, setHasFiltered] = useState(false);
  const [resetEpoch, setResetEpoch] = useState(0);
  useMobileSectionReset(sectionRef, filter !== MOST_USED, () => {
    setFilter(MOST_USED);
    setHasFiltered(false);
    // Restore the grid in one commit without replaying card entrances on return.
    setResetEpoch((epoch) => epoch + 1);
  });
  const active = filter !== MOST_USED && categories.includes(filter) ? filter : MOST_USED;
  const desktop = useMediaQuery("(min-width: 1024px) and (pointer: fine)");
  const visible =
    active === MOST_USED
      ? mostUsedSkills(ordered, desktop ? DESKTOP_MOST_USED_LIMIT : MOST_USED_LIMIT)
      : ordered.filter((s) => s.category === active);
  const scene = useMediaQuery(PINNED_SCENE_QUERY) && mode === "expressive";
  const mobilePortrait = useMediaQuery(SKILLS_MOBILE_PORTRAIT);
  const mobileLandscape = useMediaQuery(SKILLS_MOBILE_LANDSCAPE);
  const mobile = mobilePortrait || mobileLandscape;
  const HeadingReveal = mobile ? SkillsMobileReveal : ProgressiveReveal;
  const filters = [MOST_USED, ...categories];
  const activeIndex = filters.indexOf(active);
  const maxCards = Math.max(
    visible.length,
    Math.min(ordered.length, desktop ? DESKTOP_MOST_USED_LIMIT : MOST_USED_LIMIT),
    ...categories.map((category) => ordered.filter((skill) => skill.category === category).length),
  );

  // Mobile keeps only the default selection's space; larger categories extend downwards.
  const reservedCards = mobile ? Math.min(ordered.length, MOST_USED_LIMIT) : maxCards;

  const selectFilter = (value: string) => {
    if (value === active) return;
    previousPill.current = pillRef.current?.getBoundingClientRect() ?? null;
    setHasFiltered(true);
    setFilter(value);
  };

  useLayoutEffect(() => {
    const pill = pillRef.current;
    const previous = previousPill.current;
    previousPill.current = null;
    if (!pill || !previous || mode === "static" || typeof pill.animate !== "function") return;
    const current = pill.getBoundingClientRect();
    if (!current.width || !current.height) return;
    const animation = pill.animate(
      [
        {
          transform: `translate(${previous.left - current.left}px, ${previous.top - current.top}px) scale(${previous.width / current.width}, ${previous.height / current.height})`,
        },
        { transform: "translate(0, 0) scale(1, 1)" },
      ],
      { duration: 240, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
    return () => animation.cancel();
  }, [active, mode]);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const measure = () => {
      const card = grid.firstElementChild as HTMLElement | null;
      if (!card) return;
      const styles = getComputedStyle(grid);
      const columns = styles.gridTemplateColumns.split(" ").length;
      const rows = Math.ceil(reservedCards / Math.max(1, columns));
      const gap = Number.parseFloat(styles.rowGap) || 0;
      grid.style.minHeight = `${rows * card.offsetHeight + Math.max(0, rows - 1) * gap}px`;
    };
    measure();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    observer?.observe(grid);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      grid.style.removeProperty("min-height");
    };
  }, [reservedCards]);

  // Cards leaving a filter fade out in place while the rest move into their new positions.
  const cards = (
    <AnimatePresence key={resetEpoch} mode="popLayout" initial={false}>
      {visible.map((skill, index) => (
        <SkillEntrance
          key={`${skill.category}-${skill.name}`}
          filtered={hasFiltered}
          skipEntrance={mobile && resetEpoch > 0 && !hasFiltered}
          order={index}
          mobile={mobile}
          landscape={mobileLandscape}
        >
          <SkillSlot index={index}>
            <SkillCard
              name={skill.name}
              iconPath={skill.iconPath}
              level={skill.level}
              loadIcon={iconsNear}
            />
          </SkillSlot>
        </SkillEntrance>
      ))}
    </AnimatePresence>
  );

  return (
    <section
      id="skills"
      ref={sectionRef}
      data-scene={scene ? "" : undefined}
      className={`${responsiveCss.section} relative z-10 scroll-mt-[80px] overflow-x-clip overflow-y-visible`}
    >
      <SkillsScene section={sectionRef} enabled={scene}>
        <div className={responsiveCss.backdropFrame}>
          <div className={responsiveCss.backdrop}>
            <SectionBackdrop
              frame="screen"
              focus="left"
              video="/media/skills-v2.mp4"
              poster="/media/skills.webp"
              fetchPriority="low"
              deferUntilHeroLoaded
              deferUntilNearViewport
              responsivePoster={{
                srcSet:
                  "/media/skills-640.webp 640w, /media/skills-960.webp 960w, /media/skills-1280.webp 1280w, /media/skills-1536.webp 1536w",
                aspectRatio: 3 / 2,
              }}
            />
          </div>
        </div>
        <div
          className={`${responsiveCss.content} relative z-10 mx-auto flex max-w-7xl flex-col px-5 pt-6 pb-10 sm:px-8 md:pt-8 lg:block`}
        >
          <div className="lg:grid lg:grid-cols-[0.8fr_1.6fr] lg:gap-6">
            <div aria-hidden className="hidden lg:block" />
            <div className={`${responsiveCss.heading} min-w-0 text-left`}>
              <HeadingReveal
                kind="title"
                effect="focus"
                duration={1.3}
                delay={0.4}
                className={responsiveCss.title}
              >
                <div
                  className={`${labelCss.label} ${responsiveCss.sectionLabel} ${headingCss.label}`}
                  data-scroll-anchor
                >
                  <span className={labelCss.number}>{number}</span>
                  <span>Skills</span>
                  <span aria-hidden className={labelCss.rule} />
                </div>

                <h2 className={headingCss.title}>
                  Tools I{" "}
                  <span className={headingCss.accent} style={{ color: "inherit" }}>
                    trust
                  </span>
                </h2>
              </HeadingReveal>
              <aside className={responsiveCss.quoteAnchor}>
                <HeadingReveal kind="quote" effect="fade-from-right" duration={1.3} delay={0.4}>
                  <blockquote className={`${responsiveCss.quote} ${portraitCss.surface}`}>
                    <Quote aria-hidden className={responsiveCss.quoteIcon} />
                    <p>
                      Tools evolve.
                      <br />
                      Problem-solving endures.
                    </p>
                    <span aria-hidden className={responsiveCss.quoteAccent} />
                  </blockquote>
                </HeadingReveal>
              </aside>
              <HeadingReveal
                kind="description"
                effect="fade"
                duration={1.3}
                delay={0.4}
                className={responsiveCss.description}
              >
                <p className={`${subtitleCss.subtitle} mt-4 max-w-xl`}>
                  <span className={responsiveCss.desktopDescription}>
                    Infrastructure on one side, web and mobile development on the other.
                  </span>
                  <span className={responsiveCss.mobileDescription}>
                    Infrastructure, automation &amp; development.
                  </span>
                </p>
              </HeadingReveal>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.6fr]">
            <div aria-hidden className="hidden lg:block" />

            <div className="min-w-0">
              {ordered.length > 0 && (
                <ProgressiveReveal effect="cascade" duration={0} delay={0.3} staggerChildren={0.2}>
                  <div
                    className="flex flex-wrap items-center gap-2 max-lg:justify-center"
                    ref={tabsRef}
                    role="tablist"
                    aria-label="Filter skills by category"
                  >
                    {filters.map((value, index) => {
                      const selected = active === value;
                      return (
                        <m.button
                          key={value}
                          initial={false}
                          variants={{
                            hidden: { opacity: 0, scale: 0.96 },
                            visible: {
                              opacity: 1,
                              scale: 1,
                              transition:
                                mode === "static"
                                  ? { duration: 0 }
                                  : {
                                      opacity: { duration: 0.25 },
                                      scale: { type: "spring", visualDuration: 0.7, bounce: 0.5 },
                                    },
                            },
                          }}
                          type="button"
                          role="tab"
                          id={`${tabsId}-tab-${index}`}
                          aria-controls={`${tabsId}-panel`}
                          aria-selected={selected}
                          tabIndex={selected ? 0 : -1}
                          onKeyDown={(event) => {
                            const next =
                              event.key === "Home"
                                ? 0
                                : event.key === "End"
                                  ? filters.length - 1
                                  : event.key === "ArrowRight"
                                    ? (index + 1) % filters.length
                                    : event.key === "ArrowLeft"
                                      ? (index - 1 + filters.length) % filters.length
                                      : null;
                            if (next === null) return;
                            event.preventDefault();
                            selectFilter(filters[next]);
                            tabsRef.current
                              ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
                              [next]?.focus();
                          }}
                          onClick={() => selectFilter(value)}
                          whileHover={mode === "expressive" ? { y: -2 } : undefined}
                          whileTap={mode === "static" ? undefined : { scale: 0.98 }}
                          className={`${responsiveCss.tab} relative min-h-11 rounded-full px-3 text-xs font-medium transition-colors duration-200 ${
                            selected
                              ? "text-white"
                              : "text-foreground/65 hover:border-brand-mid/40 hover:text-foreground"
                          }`}
                        >
                          {selected && (
                            <span
                              ref={pillRef}
                              aria-hidden
                              className={`${responsiveCss.activePill} border-brand-bright/60 absolute inset-x-0 top-1/2 h-8 -translate-y-1/2 rounded-full border bg-(image:--gradient-brand)`}
                            />
                          )}
                          <span className="relative">{value}</span>
                        </m.button>
                      );
                    })}
                  </div>
                </ProgressiveReveal>
              )}

              <div
                role="tabpanel"
                id={`${tabsId}-panel`}
                aria-labelledby={ordered.length ? `${tabsId}-tab-${activeIndex}` : undefined}
                aria-label={ordered.length ? undefined : "Skills"}
                tabIndex={0}
                className="focus-visible:ring-brand-mid/70 rounded-xl focus-visible:ring-2 focus-visible:outline-none"
              >
                <div ref={gridRef} className={GRID}>
                  {cards}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SkillsScene>
    </section>
  );
}

export default Skills;
