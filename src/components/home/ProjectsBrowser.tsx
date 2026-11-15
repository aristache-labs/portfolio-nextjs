"use client";

import {
  currentlyBuilding,
  groupProjects,
  MAX_FEATURED,
  selectHighlights,
  type ProjectPresentation,
} from "@/lib/project-presentation";
import { useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { m, type Variants } from "framer-motion";
import { Star, History, Layers3 } from "lucide-react";
import { ProgressiveReveal } from "@/components/motion/ProgressiveReveal";
import { ProjectsGrid, ProjectsGridCard } from "./ProjectsGrid";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { useMobileSectionReset } from "@/hooks/useMobileSectionReset";
import { ProjectCard } from "./ProjectCard";
import { FeaturedCard, RecentCard } from "./HighlightCards";
import { CurrentlyBuilding } from "./CurrentlyBuilding";
import type { MergedProject } from "@/lib/projects";
import { PROJECT_CATEGORIES } from "@/lib/project-categories";
import { FOLD_VIEWPORT_QUERY, PINNED_SCENE_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import categoryCss from "./project-categories.module.css";
import layoutCss from "./projects-layout.module.css";
import {
  PROJECTS_LANDSCAPE_QUERY,
  PROJECTS_PORTRAIT_QUERY,
  ProjectsArrival,
} from "./ProjectsArrival";

// The dialog and carousel are needed only after a project is opened.
const ProjectQuickView = dynamic(
  () => import("./ProjectQuickView").then((module) => module.ProjectQuickView),
  { ssr: false },
);

const ALL = "All";
/** Filters only help with a few categories and more than a handful of projects. */
const MIN_FILTER_CATEGORIES = 2;
const MIN_FILTER_PROJECTS = 4;

const GRID = `${layoutCss.projectGrid} grid grid-cols-1 gap-6 lg:grid-cols-3 [@media(orientation:landscape)_and_(max-width:1023px)]:grid-cols-2`;

/** Scroll-driven on expressive desktops, the timed reveal everywhere else. */
function Arrival({
  scene,
  order = 0,
  from,
  lag,
  effect,
  duration,
  delay,
  className,
  children,
}: {
  scene: boolean;
  order?: number;
  from: "left" | "right";
  lag?: number;
  effect: "fade-from-left" | "fade-from-right";
  duration: number;
  delay: number;
  className: string;
  children: ReactNode;
}) {
  return (
    <ProjectsArrival
      scrollFrom={scene ? from : undefined}
      scrollLag={lag}
      kind={from === "left" ? "featured" : "recent"}
      order={order}
      effect={effect}
      duration={duration}
      delay={delay}
      className={className}
    >
      {children}
    </ProjectsArrival>
  );
}

function ColumnLabel({ children }: { children: string }) {
  const Icon = children === "Featured" ? Star : children === "Recently updated" ? History : Layers3;
  return (
    <ProjectsArrival kind="label" effect="fade" duration={0.6} delay={0.1}>
      <p className={layoutCss.groupTitle}>
        <span className={layoutCss.groupIcon} aria-hidden>
          <Icon size={16} strokeWidth={1.5} />
        </span>
        {children}
      </p>
    </ProjectsArrival>
  );
}

/**
 * Interactive half of the Projects section - client-side because the highlights, filter and grid
 * share the quick-view state. Filters the already-loaded list rather than refetching.
 */
const PRO_LANDSCAPE_QUERY =
  "(min-width: 1181px) and (max-width: 1300px) and (min-height: 700px) and (orientation: landscape) and (pointer: coarse), (min-width: 1340px) and (max-width: 1390px) and (min-height: 900px) and (max-height: 1050px) and (orientation: landscape)";

export function ProjectsBrowser({
  projects,
  header,
}: {
  projects: MergedProject[];
  /** Section heading, rendered beside the Building now card. */
  header?: ReactNode;
}) {
  const { mode } = useAnimationPolicy();
  const [hasInteracted, setHasInteracted] = useState(false);
  const cardVariants: Variants = {
    hidden: mode !== "static" ? { opacity: 0, scale: 0.9 } : { opacity: 1, scale: 1 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: mode === "static" ? 0 : 0.55,
        delay: mode === "static" ? 0 : 0.1,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };
  const [category, setCategory] = useState(ALL);
  const [extra, setExtra] = useState(0);
  // iPad-sized touch landscape behaves like the phone layouts here: fewer cards, one column.
  const narrowViewport = useMediaQuery("(max-width: 1023px)");
  const tabletTouchLandscape = useMediaQuery(
    "(orientation: landscape) and (pointer: coarse) and (min-width: 1024px) and (max-width: 1180px) and (max-height: 840px)",
  );
  const foldViewport = useMediaQuery(FOLD_VIEWPORT_QUERY);
  const ultraPortrait = useMediaQuery(
    "(min-width: 1105px) and (max-width: 1140px) and (min-height: 1500px) and (max-height: 1850px) and (orientation: portrait)",
  );
  const mobileViewport = narrowViewport || tabletTouchLandscape || foldViewport;
  const landscape = useMediaQuery("(orientation: landscape)") || foldViewport;
  const pro11Portrait = useMediaQuery(
    "(min-width: 830px) and (max-width: 840px) and (min-height: 1100px) and (max-height: 1250px) and (orientation: portrait)",
  );
  const tabletPortrait = useMediaQuery(
    "(min-width: 740px) and (max-width: 1100px) and (min-height: 900px) and (max-height: 1400px) and (orientation: portrait)",
  );
  // Two columns hold four cards (2x2); a single phone column holds three.
  const recentLimit = foldViewport || tabletPortrait || ultraPortrait ? 4 : mobileViewport ? 3 : 4;
  const containerRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  function openQuickView(project: ProjectPresentation, event: MouseEvent<HTMLButtonElement>) {
    openerRef.current = event.currentTarget;
    setQuickView(project);
    setQuickViewOpen(true);
  }
  function restoreFocus() {
    const opener = openerRef.current;
    // preventScroll: the opener can sit below the fold of a pinned card, and bringing it into
    // view would scroll the page by a whole card when the dialog closes.
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    else containerRef.current?.focus({ preventScroll: true });
  }
  const [quickView, setQuickView] = useState<ProjectPresentation | null>(null);
  // The last project stays mounted after closing, so the dialog can animate out.
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  useMobileSectionReset(containerRef, extra > 0, () => setExtra(0), quickViewOpen);

  // Derived together and keyed on `projects` alone. Splitting them meant the memo depended on
  // a `rest` array rebuilt every render, so it never actually memoised anything.
  const pageSize = ultraPortrait ? 2 : pro11Portrait ? 4 : mobileViewport ? (landscape ? 4 : 2) : 6;
  const limit = pageSize + extra;
  const { featured, recent, rest, categories, building } = useMemo(() => {
    const grouped = groupProjects(projects);
    const { featured: lead, recent: latest, rest: grid } = selectHighlights(grouped, recentLimit);

    const counts = new Map<string, number>();
    for (const p of grid) if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    return {
      building: currentlyBuilding(grouped),
      featured: lead,
      recent: latest,
      rest: grid,
      categories: PROJECT_CATEGORIES.filter((name) => counts.has(name)).map(
        (name) => [name, counts.get(name)!] as const,
      ),
    };
  }, [projects, recentLimit]);

  const showFilters =
    categories.length >= MIN_FILTER_CATEGORIES && rest.length >= MIN_FILTER_PROJECTS;
  if (category !== ALL && (!showFilters || !categories.some(([name]) => name === category))) {
    setCategory(ALL);
    setExtra(0);
  }

  const filtered = category === ALL ? rest : rest.filter((p) => p.category === category);
  const visible = filtered.slice(0, limit);
  // iPad Pro 11 held sideways has the desktop room but a touch pointer, so it never reaches
  // "expressive". Give it the same scroll scene unless motion is off.
  const ultraLandscape = useMediaQuery(
    "(min-width: 1750px) and (max-width: 1830px) and (min-height: 1000px) and (max-height: 1150px) and (orientation: landscape)",
  );
  const proLandscape = (useMediaQuery(PRO_LANDSCAPE_QUERY) || ultraLandscape) && mode !== "static";
  const scene =
    (useMediaQuery(PINNED_SCENE_QUERY) &&
      !foldViewport &&
      !ultraPortrait &&
      mode === "expressive") ||
    proLandscape;
  const portraitMotion = useMediaQuery(PROJECTS_PORTRAIT_QUERY);
  const landscapeMotion = useMediaQuery(PROJECTS_LANDSCAPE_QUERY);
  const mobileMotion = portraitMotion || landscapeMotion;
  function selectCategory(name: string) {
    if (name === category) return;
    setHasInteracted(true);
    setCategory(name);
    setExtra(0);
  }

  return (
    <div ref={containerRef} tabIndex={-1} aria-label="Projects" className="outline-none">
      {(header || building) && (
        <div className={layoutCss.head}>
          <div className={layoutCss.headCopy}>{header}</div>
          {building && (
            <CurrentlyBuilding
              project={building}
              onQuickView={(event) => openQuickView(building, event)}
            />
          )}
        </div>
      )}
      {(featured.length > 0 || recent.length > 0) && (
        <div className={layoutCss.highlights}>
          {featured.length > 0 && (
            <div className={layoutCss.column}>
              <ColumnLabel>Featured</ColumnLabel>
              <div
                className={layoutCss.featuredGrid}
                data-count={Math.min(featured.length, MAX_FEATURED)}
              >
                {featured.map((p, i) => (
                  <Arrival
                    key={p.id}
                    scene={scene}
                    order={i}
                    from="left"
                    effect="fade-from-left"
                    duration={0.7}
                    delay={i * 0.08}
                    className={`flex min-w-0 ${i === 0 ? layoutCss.heroSlot : layoutCss.asideSlot}`}
                  >
                    <FeaturedCard
                      project={p}
                      variant={i === 0 ? "hero" : "compact"}
                      eager={i === 0}
                      onQuickView={(event) => openQuickView(p, event)}
                    />
                  </Arrival>
                ))}
              </div>
            </div>
          )}

          {recent.length > 0 && (
            <div className={layoutCss.column}>
              <ColumnLabel>Recently updated</ColumnLabel>
              <div className={layoutCss.recentGrid}>
                {recent.map((p, i) => (
                  <Arrival
                    key={p.id}
                    scene={scene}
                    order={i}
                    from="right"
                    lag={(i % 2) * 0.06}
                    effect="fade-from-right"
                    duration={0.5}
                    delay={i * 0.06}
                    className="flex min-w-0"
                  >
                    <RecentCard project={p} onQuickView={(event) => openQuickView(p, event)} />
                  </Arrival>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {rest.length > 0 && (
        <>
          <ColumnLabel>More projects</ColumnLabel>
          {showFilters && (
            <ProgressiveReveal
              effect="cascade"
              duration={0}
              delay={0.3}
              staggerChildren={0.2}
              className="mb-6 flex flex-wrap items-center gap-2"
            >
              {[[ALL, rest.length] as const, ...categories].map(([name, count]) => {
                const active = category === name;
                return (
                  <m.button
                    key={name}
                    type="button"
                    onClick={() => selectCategory(name)}
                    aria-pressed={active}
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
                    whileHover={mode === "expressive" ? { y: -2 } : undefined}
                    whileTap={mode === "static" ? undefined : { scale: 0.98 }}
                    className={`${categoryCss.button} min-h-11 min-w-11 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-300 ${
                      active
                        ? "border-brand-bright/60 bg-(image:--gradient-brand-action) text-white"
                        : "text-foreground/65 hover:border-brand-mid/40 hover:text-foreground border-white/12 bg-white/3 backdrop-blur-md"
                    }`}
                  >
                    {name}
                    <span className="ml-1.5 opacity-60">{count}</span>
                  </m.button>
                );
              })}
            </ProgressiveReveal>
          )}

          <ProjectsGrid enabled={!scene && !mobileMotion} className={GRID}>
            {visible.map((p, i) => (
              <ProjectsGridCard
                key={`${category}-${p.id}`}
                mobile={mobileMotion}
                scene={scene}
                interacted={hasInteracted}
                staticMotion={mode === "static"}
                order={i}
                variants={cardVariants}
              >
                <ProjectCard project={p} onQuickView={(event) => openQuickView(p, event)} />
              </ProjectsGridCard>
            ))}
          </ProjectsGrid>

          {filtered.length > limit && (
            <ProjectsArrival kind="action" effect="fade" className="mt-8 text-center">
              <button
                type="button"
                onClick={() => {
                  setHasInteracted(true);
                  setExtra((n) => n + pageSize);
                }}
                className="border-border text-foreground hover:border-brand-mid/50 min-h-[44px] rounded-xl border px-5 py-3 text-sm font-medium transition-colors"
              >
                Show more projects
              </button>
            </ProjectsArrival>
          )}

          {filtered.length === 0 && (
            <p className="text-muted py-8 text-center text-sm">No projects in {category} yet.</p>
          )}
        </>
      )}

      {quickView && (
        <ProjectQuickView
          project={quickView}
          open={quickViewOpen}
          onClose={() => setQuickViewOpen(false)}
          onRestoreFocus={restoreFocus}
        />
      )}
    </div>
  );
}
