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
import { Star, History } from "lucide-react";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { FeaturedCard, RecentCard } from "./HighlightCards";
import { CurrentlyBuilding } from "./CurrentlyBuilding";
import type { MergedProject } from "@/lib/projects";
import { FOLD_VIEWPORT_QUERY, PINNED_SCENE_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import layoutCss from "./projects-layout.module.css";
import { ProjectsArrival } from "./ProjectsArrival";

// The dialog and carousel are needed only after a project is opened.
const ProjectQuickView = dynamic(
  () => import("./ProjectQuickView").then((module) => module.ProjectQuickView),
  { ssr: false },
);

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
  const Icon = children === "Featured" ? Star : History;
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
  const foldViewport = useMediaQuery(FOLD_VIEWPORT_QUERY);
  const ultraPortrait = useMediaQuery(
    "(min-width: 1105px) and (max-width: 1140px) and (min-height: 1500px) and (max-height: 1850px) and (orientation: portrait)",
  );
  // Recently updated is one column below 640px (three cards) and 2x2 from there (four cards).
  // The query is inverted so the server renders the wide layout, as it did before.
  const recentLimit = useMediaQuery("(max-width: 639px)") ? 3 : 4;
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

  const { featured, recent, building } = useMemo(() => {
    const grouped = groupProjects(projects);
    const { featured: lead, recent: latest } = selectHighlights(grouped, recentLimit);
    return { building: currentlyBuilding(grouped), featured: lead, recent: latest };
  }, [projects, recentLimit]);

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
