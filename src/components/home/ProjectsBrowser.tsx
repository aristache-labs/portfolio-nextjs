"use client";

import { Fragment, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { m, type Variants } from "framer-motion";
import { ProgressiveReveal } from "@/components/motion/ProgressiveReveal";
import { ScrollEntrance } from "@/components/motion/ScrollEntrance";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { ProjectCard } from "./ProjectCard";
import { FeaturedCard, RecentCard } from "./HighlightCards";
import type { MergedProject } from "@/lib/projects";
import { PROJECT_CATEGORIES } from "@/lib/project-categories";
import { PINNED_SCENE_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
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
// Featured on the left, most recently pushed on the right. Both columns are capped so the
// block stays compact; everything else falls through to the filterable grid below.
const MAX_FEATURED = 2;
const MAX_RECENT = 6;
/** Filters only help with a few categories and more than a handful of projects. */
const MIN_FILTER_CATEGORIES = 2;
const MIN_FILTER_PROJECTS = 4;

// One flex column per side. Featured covers keep their own aspect ratio.
const TRACK = "flex flex-1 flex-col gap-4";

const GRID =
  "grid grid-cols-1 gap-6 lg:grid-cols-3 [@media(orientation:landscape)_and_(max-width:1023px)]:grid-cols-2";

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
  return scene ? (
    <ScrollEntrance enabled from={from} lag={lag} className={className}>
      {children}
    </ScrollEntrance>
  ) : (
    <ProjectsArrival
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
  return (
    <ProjectsArrival kind="label" effect="fade" duration={0.6} delay={0.1}>
      <p className="text-brand-bright/90 mb-4 font-mono text-xs font-medium tracking-[0.18em] uppercase">
        {children}
      </p>
    </ProjectsArrival>
  );
}

/**
 * Interactive half of the Projects section - client-side because the highlights, filter and grid
 * share the quick-view state. Filters the already-loaded list rather than refetching.
 */
export function ProjectsBrowser({ projects }: { projects: MergedProject[] }) {
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
  const mobileViewport = useMediaQuery("(max-width: 1023px)");
  const recentLimit = mobileViewport ? 2 : MAX_RECENT;
  const containerRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  function openQuickView(project: MergedProject, event: MouseEvent<HTMLButtonElement>) {
    openerRef.current = event.currentTarget;
    setQuickView(project);
    setQuickViewOpen(true);
  }
  function restoreFocus() {
    const opener = openerRef.current;
    if (opener?.isConnected) opener.focus();
    else containerRef.current?.focus();
  }
  const [quickView, setQuickView] = useState<MergedProject | null>(null);
  // The last project stays mounted after closing, so the dialog can animate out.
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  // Derived together and keyed on `projects` alone. Splitting them meant the memo depended on
  // a `rest` array rebuilt every render, so it never actually memoised anything.
  const landscape = useMediaQuery("(orientation: landscape)");
  const pageSize = mobileViewport ? (landscape ? 4 : 2) : 6;
  const limit = pageSize + extra;
  const { featured, recent, rest, categories } = useMemo(() => {
    // projects arrives already sorted featured-first by mergeProjects.
    const lead = projects.filter((p) => p.featured).slice(0, MAX_FEATURED);
    const leadIds = new Set(lead.map((p) => p.id));
    const others = projects.filter((p) => !leadIds.has(p.id));

    // Newest push first. A project with no recorded push date sorts last instead of first, and
    // the sort is stable, so ties keep the curated order. Featured ones are excluded so the same
    // project never appears in both columns.
    const byPush = [...others].sort(
      (a, b) => (b.pushedAt?.getTime() ?? 0) - (a.pushedAt?.getTime() ?? 0),
    );
    const latest = byPush.slice(0, recentLimit);
    const latestIds = new Set(latest.map((p) => p.id));
    // Featured cards lead the grid, left to right. The sort is stable, so the rest keep
    // their curated order.
    const grid = others
      .filter((p) => !latestIds.has(p.id))
      .sort((a, b) => Number(b.featured) - Number(a.featured));

    const counts = new Map<string, number>();
    for (const p of grid) if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    return {
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
  const scene = useMediaQuery(PINNED_SCENE_QUERY) && mode === "expressive";
  const portraitMotion = useMediaQuery(PROJECTS_PORTRAIT_QUERY);
  const landscapeMotion = useMediaQuery(PROJECTS_LANDSCAPE_QUERY);
  const mobileMotion = portraitMotion || landscapeMotion;
  /** `lag` turns on the scroll entrance, placed directly around the glass card it fades. */
  const gridCard = (p: MergedProject, lag?: number) => {
    const card = <ProjectCard project={p} onQuickView={(event) => openQuickView(p, event)} />;
    if (mobileMotion) {
      return (
        <ProjectsArrival kind="card" order={lag ? 1 : 0} className="h-full">
          {card}
        </ProjectsArrival>
      );
    }
    return (
      <m.div
        initial={hasInteracted && mode !== "static" ? "hidden" : false}
        animate={hasInteracted ? "visible" : undefined}
        variants={cardVariants}
        className="h-full"
      >
        {lag === undefined ? (
          card
        ) : (
          <ScrollEntrance enabled from="below" lag={lag} className="h-full">
            {card}
          </ScrollEntrance>
        )}
      </m.div>
    );
  };
  function selectCategory(name: string) {
    if (name === category) return;
    setHasInteracted(true);
    setCategory(name);
    setExtra(0);
  }

  return (
    <div ref={containerRef} tabIndex={-1} aria-label="Projects" className="outline-none">
      {(featured.length > 0 || recent.length > 0) && (
        <div
          className={`${layoutCss.highlights} ${featured.length === MAX_FEATURED && recent.length === MAX_RECENT ? layoutCss.balanced : ""}`}
        >
          {featured.length > 0 && (
            <div className={layoutCss.column}>
              <ColumnLabel>Featured</ColumnLabel>
              <div className={TRACK}>
                {featured.map((p, i) => (
                  <Arrival
                    key={p.id}
                    scene={scene}
                    order={i}
                    from="left"
                    effect="fade-from-left"
                    duration={0.7}
                    delay={i * 0.08}
                    className="flex"
                  >
                    <FeaturedCard
                      project={p}
                      depth={scene}
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
              <div className={layoutCss.recentTrack}>
                {recent.slice(0, recentLimit).map((p, i) => (
                  <Arrival
                    key={p.id}
                    scene={scene}
                    order={i}
                    from="right"
                    lag={(i % 2) * 0.06}
                    effect="fade-from-right"
                    duration={0.5}
                    delay={i * 0.06}
                    className={`flex min-w-0 ${i >= 2 ? "max-lg:hidden" : ""}`}
                  >
                    <RecentCard
                      project={p}
                      depth={scene}
                      onQuickView={(event) => openQuickView(p, event)}
                    />
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
                        ? "border-brand-bright/60 bg-(image:--gradient-brand) text-white"
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

          {scene || mobileMotion ? (
            // Each card rises as it comes into view instead of a timed cascade.
            <div className={GRID}>
              {visible.map((p, i) => (
                <Fragment key={`${category}-${p.id}`}>
                  {gridCard(p, (i % (mobileMotion ? 2 : 3)) * 0.05)}
                </Fragment>
              ))}
            </div>
          ) : (
            <ProgressiveReveal
              effect="cascade"
              duration={0}
              delay={0}
              staggerChildren={0.1}
              viewportInset={0}
              className={GRID}
            >
              {visible.map((p) => (
                <Fragment key={`${category}-${p.id}`}>{gridCard(p)}</Fragment>
              ))}
            </ProgressiveReveal>
          )}

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
