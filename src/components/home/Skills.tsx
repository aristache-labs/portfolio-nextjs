"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { LazyMotion, domMax, m } from "framer-motion";
import { subscribeSectionNavigationComplete } from "@/lib/section-navigation";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { useMobileSectionReset } from "@/hooks/useMobileSectionReset";
import { FOLD_VIEWPORT_QUERY, PINNED_SCENE_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import { ProgressiveReveal } from "@/components/motion/ProgressiveReveal";
import { SkillsTerminalQuote } from "./SkillsTerminalQuote";
import { SkillCard, skillPercent } from "./SkillCard";
import { SkillEntrance, SolidSkillEntrance } from "./SkillEntrance";
import { SkillsMarquee } from "./SkillsMarquee";
import { SkillSlot, SkillsScene } from "./SkillsSequence";
import { SkillsGridReveal, SkillsReveal } from "./SkillsReveal";
import { AboutReveal } from "./AboutReveal";
import { HeadingWords } from "./HeadingWords";

import { SectionBackdrop, TABLET_LANDSCAPE_QUERY } from "./SectionBackdrop";
import responsiveCss from "./skills-responsive.module.css";
import { SectionLabel } from "@/components/ui/SectionLabel";
import subtitleCss from "./section-subtitle.module.css";
import headingCss from "./section-heading.module.css";
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
  const [arrivedFromMenu, setArrivedFromMenu] = useState(false);
  useEffect(
    () =>
      subscribeSectionNavigationComplete((target, arrived, revealImmediately) => {
        if (target === sectionRef.current && arrived && revealImmediately) setArrivedFromMenu(true);
      }),
    [],
  );
  const [hasFiltered, setHasFiltered] = useState(false);
  const [animateSelection, setAnimateSelection] = useState(false);
  const [resetEpoch, setResetEpoch] = useState(0);
  useMobileSectionReset(sectionRef, filter !== MOST_USED, () => {
    setFilter(MOST_USED);
    setHasFiltered(false);
    setAnimateSelection(false);
    // Restore the grid in one commit without replaying card entrances on return.
    setResetEpoch((epoch) => epoch + 1);
  });
  const active = filter !== MOST_USED && categories.includes(filter) ? filter : MOST_USED;
  const tabs = [MOST_USED, ...categories];
  const tabsId = useId();
  const tabId = (value: string) => `${tabsId}-tab-${tabs.indexOf(value)}`;
  const panelId = `${tabsId}-panel`;
  const selectTab = (value: string, pointer = false) => {
    if (value === active) return;
    setHasFiltered(true);
    setAnimateSelection(pointer);
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
    "(min-width: 1105px) and (min-height: 1500px) and (orientation: portrait)",
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
  const cards = visible.map((skill, index) => {
    const key = `${skill.category}-${skill.name}`;
    const card = (
      <SkillCard
        name={skill.name}
        iconPath={skill.iconPath}
        level={skill.level}
        loadIcon={iconsNear}
      />
    );
    return (
      <Entrance
        key={key}
        filtered={false}
        skipEntrance={arrivedFromMenu || hasFiltered || (mobile && resetEpoch > 0)}
        order={index}
        mobile={mobile}
        landscape={mobileLandscape}
      >
        {solidTablet ? (
          card
        ) : (
          <SkillSlot index={index} revealed={hasFiltered}>
            {card}
          </SkillSlot>
        )}
      </Entrance>
    );
  });

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
              poster="/media/skills-frame.webp"
              fetchPriority="low"
              deferUntilHeroLoaded
              deferUntilNearViewport
              responsivePoster={{
                srcSet:
                  "/media/skills-frame-640.webp 640w, /media/skills-frame-960.webp 960w, /media/skills-frame-1280.webp 1280w, /media/skills-frame-1536.webp 1536w",
                aspectRatio: 16 / 9,
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
              <AboutReveal className={responsiveCss.title} skipEntrance={arrivedFromMenu}>
                <SectionLabel
                  as="div"
                  number={number}
                  name="Skills"
                  delayMs={300}
                  className={`${responsiveCss.sectionLabel} ${headingCss.label}`}
                  data-scroll-anchor
                />

                <h2 className={headingCss.title}>
                  <HeadingWords lead="Tools I" accent="trust" />
                </h2>
              </AboutReveal>
              <aside className={responsiveCss.quoteAnchor}>
                <SkillsReveal
                  mobile={mobile}
                  kind="quote"
                  effect="fade-from-right"
                  duration={1.3}
                  delay={0.4}
                >
                  <SkillsTerminalQuote />
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
                    enabled={!arrivedFromMenu}
                    effect="cascade"
                    duration={0}
                    delay={0.3}
                    staggerChildren={0.2}
                  >
                    <div
                      className="flex flex-wrap items-center gap-2 max-lg:justify-center pointer-coarse:gap-y-3.5"
                      role="tablist"
                      aria-label="Filter skills by category"
                    >
                      {tabs.map((value) => {
                        const selected = active === value;
                        return (
                          <m.button
                            key={value}
                            initial={false}
                            animate={arrivedFromMenu ? { opacity: 1, scale: 1 } : undefined}
                            transition={arrivedFromMenu ? { duration: 0 } : undefined}
                            variants={
                              arrivedFromMenu
                                ? undefined
                                : {
                                    hidden: { opacity: 0, scale: 0 },
                                    visible: {
                                      opacity: 1,
                                      scale: 1,
                                      transition:
                                        mode === "static"
                                          ? { duration: 0 }
                                          : {
                                              opacity: { duration: 0.25 },
                                              scale: {
                                                type: "spring",
                                                visualDuration: 0.7,
                                                bounce: 0.5,
                                              },
                                            },
                                    },
                                  }
                            }
                            type="button"
                            role="tab"
                            id={tabId(value)}
                            aria-selected={selected}
                            aria-controls={panelId}
                            tabIndex={selected ? 0 : -1}
                            onKeyDown={onTabKeyDown}
                            onClick={(event) => selectTab(value, event.detail > 0)}
                            whileHover={mode === "expressive" ? { y: -2 } : undefined}
                            // On touch screens an invisible ::before lifts the 30px chip to a 44px target; the wrapped
                            // rows sit 14px apart so neighbouring targets never overlap.
                            className={`relative rounded-full border px-3 py-1.5 text-xs font-medium pointer-coarse:before:absolute pointer-coarse:before:inset-x-0 pointer-coarse:before:-inset-y-[7px] ${
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
                                  mode === "static" || !animateSelection
                                    ? { duration: 0 }
                                    : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
                                }
                                className="border-brand-bright/60 absolute -inset-px rounded-full border bg-(image:--gradient-brand-action)"
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
                  id={panelId}
                  role={ordered.length > 0 ? "tabpanel" : undefined}
                  aria-labelledby={ordered.length > 0 ? tabId(active) : undefined}
                >
                  {solidTablet ? (
                    <div ref={gridRef} className={GRID}>
                      {cards}
                    </div>
                  ) : (
                    <SkillsGridReveal
                      enabled={!scene && !mobile && !hasFiltered}
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
