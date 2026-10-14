"use client";

import { useMemo, useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { ProjectCard } from "./ProjectCard";
import { FeaturedCard, RecentCard } from "./HighlightCards";
import { ProjectQuickView } from "./ProjectQuickView";
import type { MergedProject } from "@/lib/projects";

const ALL = "All";
// Featured on the left, most recently pushed on the right. Both columns are capped so the
// block stays compact; everything else falls through to the filterable grid below.
const MAX_FEATURED = 2;
const MAX_RECENT = 3;

// One flex column per side. The grid stretches both columns to the same height, and flex-1
// splits that height across the cards in the column (2 on the left, 3 on the right).
const TRACK = "flex flex-1 flex-col gap-4";

function ColumnLabel({ children }: { children: string }) {
  return (
    <h3 className="text-muted mb-3 font-mono text-xs tracking-[0.2em] uppercase">{children}</h3>
  );
}

/**
 * Interactive half of the Projects section - client-side because the highlights, filter and grid
 * share the quick-view state. Filters the already-loaded list rather than refetching.
 */
export function ProjectsBrowser({ projects }: { projects: MergedProject[] }) {
  const [language, setLanguage] = useState(ALL);
  const [quickView, setQuickView] = useState<MergedProject | null>(null);

  // Derived together and keyed on `projects` alone. Splitting them meant the memo depended on
  // a `rest` array rebuilt every render, so it never actually memoised anything.
  const { featured, recent, rest, languages } = useMemo(() => {
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
    const latest = byPush.slice(0, MAX_RECENT);
    const latestIds = new Set(latest.map((p) => p.id));
    const grid = others.filter((p) => !latestIds.has(p.id));

    // Counted over the grid only, so a filter chip's number matches what it reveals.
    const counts = new Map<string, number>();
    for (const p of grid) {
      if (p.language) counts.set(p.language, (counts.get(p.language) ?? 0) + 1);
    }
    return {
      featured: lead,
      recent: latest,
      rest: grid,
      languages: [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    };
  }, [projects]);

  const filtered = language === ALL ? rest : rest.filter((p) => p.language === language);

  return (
    <>
      {(featured.length > 0 || recent.length > 0) && (
        <div className="mb-10 grid items-stretch gap-8 lg:grid-cols-2">
          {featured.length > 0 && (
            <div className="flex flex-col">
              <ColumnLabel>Featured</ColumnLabel>
              <div className={TRACK}>
                {featured.map((p, i) => (
                  <Reveal key={p.id} delay={i * 0.05} className="flex min-h-0 flex-1">
                    <FeaturedCard project={p} onQuickView={() => setQuickView(p)} />
                  </Reveal>
                ))}
              </div>
            </div>
          )}

          {recent.length > 0 && (
            <div className="flex flex-col">
              <ColumnLabel>Recently updated</ColumnLabel>
              <div className={TRACK}>
                {recent.map((p, i) => (
                  <Reveal key={p.id} delay={0.1 + i * 0.05} className="flex min-h-0 flex-1">
                    <RecentCard project={p} onQuickView={() => setQuickView(p)} />
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {rest.length > 0 && (
        <>
          {languages.length > 1 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {[[ALL, rest.length] as const, ...languages].map(([name, count]) => {
                const active = language === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setLanguage(name)}
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

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p, i) => (
              <Reveal key={p.id} delay={(i % 3) * 0.05} className="h-full">
                <ProjectCard project={p} onQuickView={() => setQuickView(p)} />
              </Reveal>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-muted py-8 text-center text-sm">No projects in {language} yet.</p>
          )}
        </>
      )}

      <ProjectQuickView project={quickView} onClose={() => setQuickView(null)} />
    </>
  );
}
