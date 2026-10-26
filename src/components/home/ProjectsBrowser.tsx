"use client";

import { useMemo, useState } from "react";
import { m, type Variants } from "framer-motion";
import { ProgressiveReveal } from "@/components/motion/ProgressiveReveal";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { ProjectCard } from "./ProjectCard";
import { FeaturedCard, RecentCard } from "./HighlightCards";
import { ProjectQuickView } from "./ProjectQuickView";
import type { MergedProject } from "@/lib/projects";
import { PROJECT_CATEGORIES } from "@/lib/project-categories";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const ALL = "All";
// Featured on the left, most recently pushed on the right. Both columns are capped so the
// block stays compact; everything else falls through to the filterable grid below.
const MAX_FEATURED = 2;
const MAX_RECENT = 8;

// One flex column per side. Featured covers keep their own aspect ratio.
const TRACK = "flex flex-1 flex-col gap-4";

function ColumnLabel({ children }: { children: string }) {
  return (
    <h3 className="text-brand-bright border-brand-mid/60 mb-4 border-l-2 pl-3 font-mono text-[14px] font-semibold tracking-[0.16em] uppercase lg:text-[16px]">
      {children}
    </h3>
  );
}

/**
 * Interactive half of the Projects section - client-side because the highlights, filter and grid
 * share the quick-view state. Filters the already-loaded list rather than refetching.
 */
export function ProjectsBrowser({ projects }: { projects: MergedProject[] }) {
  const { mode } = useAnimationPolicy();
  const cardVariants: Variants = {
    hidden:
      mode === "expressive" ? { opacity: 0, y: 14, scale: 0.985 } : { opacity: 1, y: 0, scale: 1 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: mode === "expressive" ? 0.85 : 0,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };
  const recentVariants: Variants = {
    hidden: mode === "expressive" ? { opacity: 0, x: 12 } : { opacity: 1, x: 0 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: mode === "expressive" ? 0.8 : 0,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };
  const [category, setCategory] = useState(ALL);
  const [extra, setExtra] = useState(0);
  const mobileViewport = useMediaQuery("(max-width: 1023px)");
  const recentLimit = mobileViewport ? 2 : MAX_RECENT;
  const [quickView, setQuickView] = useState<MergedProject | null>(null);

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
      categories: PROJECT_CATEGORIES.map((name) => [name, counts.get(name) ?? 0] as const),
    };
  }, [projects, recentLimit]);

  const filtered = category === ALL ? rest : rest.filter((p) => p.category === category);
  const visible = filtered.slice(0, limit);
  function selectCategory(name: string) {
    setCategory(name);
    setExtra(0);
  }

  return (
    <>
      {(featured.length > 0 || recent.length > 0) && (
        <div className="mb-10 grid items-start gap-6 lg:grid-cols-2 [@media(orientation:landscape)_and_(max-height:500px)]:grid-cols-2 [@media(orientation:landscape)_and_(max-height:500px)]:gap-4">
          {featured.length > 0 && (
            <div className="flex flex-col">
              <ColumnLabel>Featured</ColumnLabel>
              <div className={TRACK}>
                {featured.map((p, i) => (
                  <ProgressiveReveal
                    key={p.id}
                    effect="focus"
                    desktopDelay={i * 0.08}
                    className="flex"
                  >
                    <FeaturedCard project={p} onQuickView={() => setQuickView(p)} />
                  </ProgressiveReveal>
                ))}
              </div>
            </div>
          )}

          {recent.length > 0 && (
            <div className="flex flex-col">
              <ColumnLabel>Recently updated</ColumnLabel>
              <ProgressiveReveal effect="cascade" className="grid gap-4 lg:grid-cols-2">
                {recent.slice(0, recentLimit).map((p, i) => (
                  <m.div
                    key={p.id}
                    initial={false}
                    variants={recentVariants}
                    className={`flex min-w-0 ${i >= 2 ? "max-lg:hidden" : ""}`}
                  >
                    <RecentCard project={p} onQuickView={() => setQuickView(p)} />
                  </m.div>
                ))}
              </ProgressiveReveal>
            </div>
          )}
        </div>
      )}

      {rest.length > 0 && (
        <>
          <ColumnLabel>Categories</ColumnLabel>
          {categories.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {[[ALL, rest.length] as const, ...categories].map(([name, count]) => {
                const active = category === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => selectCategory(name)}
                    aria-pressed={active}
                    className={
                      active
                        ? "rounded-full border border-(--brand-deep)/50 bg-(--chip-surface) px-3 py-1.5 text-xs font-semibold text-(--accent-on-chip) transition-colors"
                        : "border-border text-muted hover:border-foreground/30 hover:text-foreground rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                    }
                  >
                    {name}
                    <span className="ml-1.5 opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          <ProgressiveReveal
            effect="cascade"
            className="grid grid-cols-1 gap-6 lg:grid-cols-3 [@media(orientation:landscape)_and_(max-width:1023px)]:grid-cols-2"
          >
            {visible.map((p) => (
              <m.div key={p.id} initial={false} variants={cardVariants} className="h-full">
                <ProjectCard project={p} onQuickView={() => setQuickView(p)} />
              </m.div>
            ))}
          </ProgressiveReveal>

          {filtered.length > limit && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setExtra((n) => n + pageSize)}
                className="border-border text-foreground hover:border-brand-mid/50 min-h-[44px] rounded-xl border px-5 py-3 text-sm font-medium transition-colors"
              >
                Show more projects
              </button>
            </div>
          )}

          {filtered.length === 0 && (
            <p className="text-muted py-8 text-center text-sm">No projects in {category} yet.</p>
          )}
        </>
      )}

      <ProjectQuickView project={quickView} onClose={() => setQuickView(null)} />
    </>
  );
}
