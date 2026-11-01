"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LazyMotion, domMax, m } from "framer-motion";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
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
/** Default tab keeps the grid to one screen. A category pill reveals that group. */
const MOST_USED_LIMIT = 8;
const GRID =
  "mt-4 grid min-w-0 grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4 [@media(orientation:landscape)_and_(max-width:1023px)_and_(max-height:500px)]:mx-auto [@media(orientation:landscape)_and_(max-width:1023px)_and_(max-height:500px)]:max-w-[640px]";

function byOrder(skills: SkillRow[]) {
  return [...skills].sort((a, b) => a.order - b.order);
}

/** Highest levels first; admin order breaks ties. Missing levels follow rated skills. */
function mostUsedSkills(skills: SkillRow[]) {
  return [...skills]
    .sort(
      (a, b) => (skillPercent(b.level) ?? -1) - (skillPercent(a.level) ?? -1) || a.order - b.order,
    )
    .slice(0, MOST_USED_LIMIT);
}

export function Skills({ skills, number = "02" }: { skills: SkillRow[]; number?: string }) {
  const { mode } = useAnimationPolicy();
  const sectionRef = useRef<HTMLElement>(null);
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
  const active = filter !== MOST_USED && categories.includes(filter) ? filter : MOST_USED;
  const visible =
    active === MOST_USED ? mostUsedSkills(ordered) : ordered.filter((s) => s.category === active);
  const scene = useMediaQuery(PINNED_SCENE_QUERY) && mode === "expressive";

  // Cards leaving a filter fade out in place while the rest move into their new positions.
  const cards = (
    <AnimatePresence mode="popLayout" initial={false}>
      {visible.map((skill, index) => (
        <SkillEntrance key={`${skill.category}-${skill.name}`} filtered={hasFiltered} order={index}>
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
        <div
          className={`${responsiveCss.content} relative z-10 mx-auto flex max-w-7xl flex-col px-5 pt-6 pb-10 sm:px-8 md:pt-8 lg:block`}
        >
          <div className="lg:grid lg:grid-cols-[0.8fr_1.6fr] lg:gap-6">
            <div aria-hidden className="hidden lg:block" />
            <div className={`${responsiveCss.heading} min-w-0 text-left`}>
              <ProgressiveReveal
                effect="focus"
                duration={1.3}
                delay={0.4}
                className={responsiveCss.title}
              >
                <div
                  className={`${labelCss.label} ${responsiveCss.sectionLabel}`}
                  data-scroll-anchor
                >
                  <span className={labelCss.number}>{number}</span>
                  <span>Skills</span>
                  <span aria-hidden className={labelCss.rule} />
                </div>

                <h2 className={`${responsiveCss.titleText} font-display mt-3`}>
                  Tools I <span>trust</span>
                </h2>
              </ProgressiveReveal>
              <aside className={responsiveCss.quoteAnchor}>
                <ProgressiveReveal effect="fade-from-right" duration={1.3} delay={0.4}>
                  <blockquote className={responsiveCss.quote}>
                    <Quote aria-hidden className={responsiveCss.quoteIcon} />
                    <p>
                      Tools evolve.
                      <br />
                      Problem-solving endures.
                    </p>
                    <span aria-hidden className={responsiveCss.quoteAccent} />
                  </blockquote>
                </ProgressiveReveal>
              </aside>
              <ProgressiveReveal
                effect="fade"
                duration={1.3}
                delay={0.4}
                className={responsiveCss.description}
              >
                <p className={`${subtitleCss.subtitle} mt-4 max-w-xl`}>
                  Infrastructure on one side, web and mobile development on the other.
                </p>
              </ProgressiveReveal>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.6fr]">
            <div aria-hidden className="hidden lg:block" />

            {/* Layout features stay inside the dynamically loaded Skills section. */}
            <LazyMotion features={domMax}>
              <div className="min-w-0">
                {ordered.length > 0 && (
                  <ProgressiveReveal
                    effect="cascade"
                    duration={0}
                    delay={0.3}
                    staggerChildren={0.2}
                  >
                    <div
                      className="flex flex-wrap items-center gap-2 max-lg:justify-center"
                      role="tablist"
                      aria-label="Filter skills by category"
                    >
                      {[MOST_USED, ...categories].map((value) => {
                        const selected = active === value;
                        return (
                          <m.button
                            key={value}
                            initial={false}
                            variants={{
                              hidden: { opacity: 0, scale: 0 },
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
                            aria-selected={selected}
                            onClick={() => {
                              if (value === active) return;
                              setHasFiltered(true);
                              setFilter(value);
                            }}
                            whileHover={mode === "expressive" ? { y: -2 } : undefined}
                            whileTap={mode === "static" ? undefined : { scale: 0.98 }}
                            className={`relative rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-300 ${
                              selected
                                ? "border-transparent text-white"
                                : "text-foreground/65 hover:border-brand-mid/40 hover:text-foreground border-white/12 bg-white/3 backdrop-blur-md"
                            }`}
                          >
                            {/* One shared pill slides from the previous tab to the selected one. */}
                            {selected && (
                              <m.span
                                aria-hidden
                                layoutId="skills-active-tab"
                                transition={
                                  mode === "static"
                                    ? { duration: 0 }
                                    : { type: "spring", visualDuration: 0.45, bounce: 0.2 }
                                }
                                className="border-brand-bright/60 absolute -inset-px rounded-full border bg-(image:--gradient-brand)"
                              />
                            )}
                            <span className="relative">{value}</span>
                          </m.button>
                        );
                      })}
                    </div>
                  </ProgressiveReveal>
                )}

                {/* Stable keys let shared cards move between their old and new grid positions. */}
                {scene ? (
                  // The desktop scene drives each card from scrolling instead of a timed cascade.
                  <div className={GRID}>{cards}</div>
                ) : (
                  <ProgressiveReveal
                    effect="cascade"
                    duration={1.3}
                    delay={0.4}
                    staggerChildren={0.18}
                    className={GRID}
                  >
                    {cards}
                  </ProgressiveReveal>
                )}
              </div>
            </LazyMotion>
          </div>
        </div>
      </SkillsScene>
    </section>
  );
}

export default Skills;
