"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, LazyMotion, domMax, m } from "framer-motion";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { useMobileSectionReset } from "@/hooks/useMobileSectionReset";
import { FOLD_VIEWPORT_QUERY, PINNED_SCENE_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import { ProgressiveReveal } from "@/components/motion/ProgressiveReveal";
import { Quote } from "lucide-react";
import { SkillCard, skillPercent } from "./SkillCard";
import { SkillEntrance, SolidSkillEntrance } from "./SkillEntrance";
import { SkillsMarquee } from "./SkillsMarquee";
import { SkillSlot, SkillsScene } from "./SkillsSequence";
import { SkillsGridReveal, SkillsReveal } from "./SkillsReveal";
import { SectionBackdrop, TABLET_LANDSCAPE_QUERY } from "./SectionBackdrop";
import responsiveCss from "./skills-responsive.module.css";
import labelCss from "@/components/ui/section-label.module.css";
import subtitleCss from "./section-subtitle.module.css";
import headingCss from "./section-heading.module.css";
import quoteCss from "./skills-quote.module.css";
import { SKILLS_MOBILE_LANDSCAPE, SKILLS_MOBILE_PORTRAIT } from "./SkillsMobileReveal";

export type SkillRow = {
  name: string;
  iconPath: string;
  category: string;
  order: number;
  level?: string | null;
};

const MOST_USED = "Most Used";
const IPAD_PRO_LANDSCAPE_QUERY =
  "(min-width: 1340px) and (max-width: 1390px) and (min-height: 900px) and (max-height: 1050px) and (orientation: landscape), (min-width: 1750px) and (max-width: 1830px) and (min-height: 1000px) and (max-height: 1150px) and (orientation: landscape)";
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
  const tabs = [MOST_USED, ...categories];
  const tabsId = useId();
  const tabId = (value: string) => `${tabsId}-tab-${tabs.indexOf(value)}`;
  const panelId = `${tabsId}-panel`;
  const selectTab = (value: string) => {
    if (value === active) return;
    setHasFiltered(true);
    setFilter(value);
  };
  // WAI-ARIA tabs with automatic activation: arrows, Home and End move focus and select.
  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = tabs.indexOf(active);
    const next =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? (index + 1) % tabs.length
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? (index - 1 + tabs.length) % tabs.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? tabs.length - 1
              : -1;
    if (next < 0) return;
    event.preventDefault();
    selectTab(tabs[next]);
    document.getElementById(tabId(tabs[next]))?.focus();
  };
  const fold = useMediaQuery(FOLD_VIEWPORT_QUERY);
  const desktop = useMediaQuery("(min-width: 1024px) and (pointer: fine)") && !fold;
  const ipadProLandscape = useMediaQuery(IPAD_PRO_LANDSCAPE_QUERY);
  const ultraPortrait = useMediaQuery(
    "(min-width: 1105px) and (max-width: 1140px) and (min-height: 1500px) and (max-height: 1850px) and (orientation: portrait)",
  );
  const solidTablet = ipadProLandscape || ultraPortrait;
  const tabletLandscape = useMediaQuery(TABLET_LANDSCAPE_QUERY) || ipadProLandscape;
  const visible =
    active === MOST_USED
      ? mostUsedSkills(
          ordered,
          desktop || tabletLandscape ? DESKTOP_MOST_USED_LIMIT : MOST_USED_LIMIT,
        )
      : ordered.filter((s) => s.category === active);
  const scene = useMediaQuery(PINNED_SCENE_QUERY) && !fold && !solidTablet && mode === "expressive";
  const mobilePortrait = useMediaQuery(SKILLS_MOBILE_PORTRAIT);
  const mobileLandscape = useMediaQuery(SKILLS_MOBILE_LANDSCAPE);
  const mobile = mobilePortrait || mobileLandscape;
  const mostUsedGridHeight = useRef(0);

  useEffect(() => {
    const grid = gridRef.current;
    if (!mobilePortrait || !grid) return;
    // Keep spare space below the cards instead of stretching shorter categories' rows.
    grid.style.alignContent = "start";
    const measure = () => {
      if (active === MOST_USED) {
        grid.style.removeProperty("min-height");
        mostUsedGridHeight.current = grid.offsetHeight;
      }
      // Larger categories may grow naturally, but never become the new minimum.
      grid.style.minHeight = `${mostUsedGridHeight.current}px`;
    };
    measure();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    observer?.observe(grid);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      grid.style.removeProperty("min-height");
      grid.style.removeProperty("align-content");
    };
  }, [mobilePortrait, active]);

  const Entrance = solidTablet ? SolidSkillEntrance : SkillEntrance;
  // Stable keys let shared cards move while leaving cards finish outside the grid flow.
  const cards = (
    <AnimatePresence key={resetEpoch} mode="popLayout" initial={false}>
      {visible.map((skill, index) => (
        <Entrance
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
        </Entrance>
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
              tabletVideo
              tabletVideoQuery={`${TABLET_LANDSCAPE_QUERY}, ${IPAD_PRO_LANDSCAPE_QUERY}`}
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
          <div className={`${responsiveCss.split} lg:grid lg:grid-cols-[0.8fr_1.6fr] lg:gap-6`}>
            <div aria-hidden className="hidden lg:block" />
            <div className={`${responsiveCss.heading} min-w-0 text-left`}>
              <SkillsReveal
                mobile={mobile}
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
                  Tools I <span className={headingCss.accent}>trust</span>
                </h2>
              </SkillsReveal>
              <aside className={responsiveCss.quoteAnchor}>
                <SkillsReveal
                  mobile={mobile}
                  kind="quote"
                  effect="fade-from-right"
                  duration={1.3}
                  delay={0.4}
                >
                  <blockquote className={`${responsiveCss.quote} ${quoteCss.glass}`}>
                    <Quote aria-hidden className={responsiveCss.quoteIcon} />
                    <p>
                      Tools evolve.
                      <br />
                      Problem-solving endures.
                    </p>
                    <span aria-hidden className={responsiveCss.quoteAccent} />
                  </blockquote>
                </SkillsReveal>
              </aside>
              <SkillsReveal
                mobile={mobile}
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
              </SkillsReveal>
            </div>
          </div>

          <div
            className={`${responsiveCss.split} ${responsiveCss.tools} mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.6fr]`}
          >
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
                      {tabs.map((value) => {
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
                            id={tabId(value)}
                            aria-selected={selected}
                            aria-controls={panelId}
                            tabIndex={selected ? 0 : -1}
                            onKeyDown={onTabKeyDown}
                            onClick={() => selectTab(value)}
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
                <div
                  id={panelId}
                  role={ordered.length > 0 ? "tabpanel" : undefined}
                  aria-labelledby={ordered.length > 0 ? tabId(active) : undefined}
                >
                  {solidTablet ? (
                    <AnimatePresence mode="wait" initial={false}>
                      <m.div
                        key={active}
                        ref={gridRef}
                        className={GRID}
                        initial={false}
                        animate={{
                          transform: "translateY(0px)",
                        }}
                        exit={
                          mode === "static"
                            ? undefined
                            : {
                                transform: "translateY(-8px)",
                                transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] },
                              }
                        }
                      >
                        {visible.map((skill, index) => (
                          <SolidSkillEntrance
                            key={`${skill.category}-${skill.name}`}
                            filtered={hasFiltered}
                            order={index}
                          >
                            <SkillCard
                              name={skill.name}
                              iconPath={skill.iconPath}
                              level={skill.level}
                              loadIcon={iconsNear}
                            />
                          </SolidSkillEntrance>
                        ))}
                      </m.div>
                    </AnimatePresence>
                  ) : (
                    <SkillsGridReveal
                      enabled={!scene && !mobile}
                      gridRef={gridRef}
                      className={GRID}
                    >
                      {cards}
                    </SkillsGridReveal>
                  )}
                </div>
                {!tabletLandscape && (
                  <SkillsMarquee skills={ordered} loadIcons={iconsNear && !desktop} />
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
