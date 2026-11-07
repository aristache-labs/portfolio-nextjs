"use client";

import { cardDescription } from "@/lib/project-presentation";
import { ProjectComponents } from "./ProjectComponents";

import type { MouseEventHandler } from "react";

import actionStyles from "./project-actions.module.css";
import motionStyles from "./project-motion.module.css";
import layoutStyles from "./projects-layout.module.css";

import Image from "next/image";
import { useProjectCoversReady } from "./ProjectCoverGate";
import { ExternalLink, GitFork, Github, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ScrollDepth } from "@/components/motion/ScrollDepth";
import type { MergedProject } from "@/lib/projects";
import { pluralize } from "@/utils/plural";
import { COMPACT_PROJECT_ACTION, GLASS_CARD, PRIMARY_TAG } from "./project-styles";
import { FOLD_VIEWPORT_QUERY } from "@/lib/motion-queries";

// Fallbacks follow site-container padding and the two-column highlights layout.
// Lazy covers use their actual layout width when the browser supports auto sizes.
const FEATURED_COVER_SIZES = [
  `${FOLD_VIEWPORT_QUERY} calc((100vw - clamp(3rem, 5vw, 5.5rem)) * 0.86)`,
  "(orientation: portrait) calc(100vw - clamp(3rem, 5vw, 5.5rem))",
  "(min-width: 1024px) calc((min(100vw, 86rem) - clamp(3rem, 5vw, 5.5rem) - 1.5rem) / 2)",
  "(orientation: landscape) and (min-width: 640px) calc((100vw - clamp(3rem, 5vw, 5.5rem) - 1.5rem) / 2)",
  "calc(100vw - clamp(3rem, 5vw, 5.5rem))",
].join(", ");

const RECENT_COVER_SIZES = [
  `${FOLD_VIEWPORT_QUERY} 192px`,
  "(orientation: portrait) and (max-width: 1023px) 80px",
  "(orientation: portrait) calc(min(100vw, 86rem) - clamp(3rem, 5vw, 5.5rem) - 1.5rem)",
  "(orientation: landscape) and (max-width: 1023px) and (max-height: 500px) and (pointer: coarse) calc(18vw)",
  "(min-width: 1024px) calc((min(100vw, 86rem) - clamp(3rem, 5vw, 5.5rem) - 3.5rem) / 4 - 1.5rem)",
  "(min-width: 640px) 192px",
  "(orientation: landscape) and (max-height: 500px) calc((100vw - clamp(3rem, 5vw, 5.5rem) - 1rem) / 2 - 1.75rem)",
  "calc(100vw - clamp(3rem, 5vw, 5.5rem) - 1.75rem)",
].join(", ");

function Cover({
  project,
  sizes,
  fit,
  priority = false,
  loading = "lazy",
}: {
  project: MergedProject;
  sizes: string;
  fit: string;
  priority?: boolean;
  loading?: "eager" | "lazy";
}) {
  const ready = useProjectCoversReady();
  if (project.coverImage && !ready)
    return (
      <>
        <div className="size-full bg-white/3" />
        <noscript>
          {/* Native fallback is intentionally outside Next image optimization when JS is off. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.coverImage}
            alt=""
            loading="lazy"
            className={`absolute inset-0 size-full ${fit}`}
          />
        </noscript>
      </>
    );
  return project.coverImage ? (
    <Image
      src={project.coverImage}
      alt=""
      fill
      sizes={priority || loading === "eager" ? sizes : `auto, ${sizes}`}
      loading={priority ? undefined : loading}
      // Card covers render at thumbnail size; the default quality is visually identical there
      // and roughly a third lighter. Quick View keeps 90 for full-width screenshots.
      fetchPriority="low"
      priority={priority}
      className={`${motionStyles.cover} ${fit}`}
    />
  ) : (
    <div className="size-full bg-(image:--gradient-brand) opacity-70" />
  );
}

function Stats({ project }: { project: MergedProject }) {
  return (
    <div className="text-muted flex shrink-0 items-center gap-3 text-xs">
      {(project.forks ?? 0) > 0 && (
        <span
          className="flex items-center gap-1"
          aria-label={pluralize(project.forks ?? 0, "fork")}
        >
          <GitFork className="size-3.5" aria-hidden /> {project.forks ?? "—"}
        </span>
      )}
    </div>
  );
}

/**
 * The first chip is GitHub's primary language. The rest are the tags stored on the project
 * (admin), the same kind of hand-written labels a site shows beyond the language bar.
 */
function Tags({ project }: { project: MergedProject }) {
  if (!project.language && project.tags.length === 0) return null;
  return (
    <div className="ml-auto flex min-w-0 basis-[max-content] flex-wrap justify-end gap-1.5 [&>span]:px-2.5 [&>span]:py-1 [&>span]:text-[12px]">
      {project.language && <span className={PRIMARY_TAG}>{project.language}</span>}
      {project.tags.map((tag) => (
        <span
          key={tag}
          className="border-border text-muted rounded-full border bg-(--chip-surface) px-1.5 py-0.5 text-[10px] leading-tight"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function Actions({
  project,
  onQuickView,
  compact = false,
}: {
  project: MergedProject;
  onQuickView: MouseEventHandler<HTMLButtonElement>;
  compact?: boolean;
}) {
  const githubUrl = project.htmlUrl ?? `https://github.com/aristache-labs/${project.repo}`;
  const compactClass = compact ? COMPACT_PROJECT_ACTION : undefined;
  return (
    <div
      className={`${actionStyles.actions} ${compact ? `${actionStyles.recent} ${actionStyles.compact} mt-2` : `${actionStyles.featured} mt-4`} flex flex-wrap items-center gap-2`}
    >
      <Button
        className={compactClass}
        size="sm"
        onClick={onQuickView}
        aria-label={`View ${project.title}`}
        leftIcon={<Maximize2 className="size-3.5" aria-hidden />}
      >
        View
      </Button>
      <Button
        href={githubUrl}
        aria-label={`Code for ${project.title}`}
        title="View code on GitHub"
        className={compactClass}
        variant="secondary"
        size="sm"
        target="_blank"
        rel="noopener noreferrer"
        leftIcon={
          <Github style={{ width: compact ? 16 : 20, height: compact ? 16 : 20 }} aria-hidden />
        }
      >
        <span className={`${actionStyles.githubLabel} sr-only`}>GitHub</span>
      </Button>
      {project.homepage && (
        <Button
          href={project.homepage}
          aria-label={`Live site for ${project.title}`}
          className={compactClass}
          variant="ghost"
          size="sm"
          target="_blank"
          rel="noopener noreferrer"
          leftIcon={<ExternalLink className="size-3.5" aria-hidden />}
        >
          Live
        </Button>
      )}
      {compact && (
        <span className="text-muted ml-auto shrink-0 rounded-md border border-white/10 bg-white/3 px-2 py-1 text-[10px] tracking-[0.04em] uppercase">
          {("hasLive" in project ? project.hasLive : project.homepage)
            ? "Released"
            : "In development"}
        </span>
      )}
    </div>
  );
}

const SHELL = `${GLASS_CARD} group relative h-full w-full overflow-hidden rounded-2xl border transition-colors duration-300 hover:border-(--brand-mid)/40`;

/** Big card: preview on top, then title, a short description, tags and actions. */
export function FeaturedCard({
  project,
  onQuickView,
  depth = false,
  eager = false,
}: {
  project: MergedProject;
  onQuickView: MouseEventHandler<HTMLButtonElement>;
  eager?: boolean;
  /** Let the cover drift and settle inside its frame while scrolling (expressive desktops). */
  depth?: boolean;
}) {
  return (
    <article className={`${motionStyles.card} ${layoutStyles.featuredCard} ${SHELL} flex flex-col`}>
      <ScrollDepth
        enabled={depth}
        className={`${layoutStyles.featuredImage} relative aspect-video w-full shrink-0 overflow-hidden border-b border-white/8`}
      >
        <Cover
          project={project}
          sizes={FEATURED_COVER_SIZES}
          fit="object-cover"
          loading={eager ? "eager" : "lazy"}
        />
      </ScrollDepth>
      <div className={`${layoutStyles.featuredBody} flex flex-1 flex-col p-4 sm:p-5`}>
        <span
          className={`${layoutStyles.featuredLabel} text-brand-mid mb-1.5 font-mono text-[11px] tracking-[0.18em] uppercase`}
        >
          Featured
        </span>
        <div
          className={`${actionStyles.featuredHeading} flex flex-wrap items-center justify-between gap-x-3 gap-y-2`}
        >
          <h3 className="max-w-full min-w-0 text-lg leading-snug font-semibold break-words">
            {project.title}
          </h3>
          <Tags project={project} />
        </div>
        {(project.forks ?? 0) > 0 && (
          <div className="mt-2">
            <Stats project={project} />
          </div>
        )}
        {cardDescription(project) && (
          <p
            className={`${actionStyles.featuredDescription} text-muted mt-2 line-clamp-2 text-sm leading-relaxed text-pretty lg:line-clamp-3`}
          >
            {cardDescription(project)}
          </p>
        )}
        <ProjectComponents project={project} />
        <div className="mt-auto">
          <Actions project={project} onQuickView={onQuickView} />
        </div>
      </div>
    </article>
  );
}

/** Compact card with a shared title/update row and smaller actions. */
export function RecentCard({
  project,
  onQuickView,
  priority = false,
  depth = false,
}: {
  project: MergedProject;
  onQuickView: MouseEventHandler<HTMLButtonElement>;
  priority?: boolean;
  /** Let the cover drift and settle inside its frame while scrolling (expressive desktops). */
  depth?: boolean;
}) {
  return (
    <article
      className={`${motionStyles.card} ${layoutStyles.recentCard} ${actionStyles.recentCard} ${SHELL} flex flex-col gap-3.5 p-3.5 sm:flex-row sm:items-stretch sm:p-4 lg:flex-col lg:p-3`}
    >
      <ScrollDepth
        enabled={depth}
        className={`${layoutStyles.recentImage} ${actionStyles.recentImage} ring-border relative aspect-video w-full shrink-0 overflow-hidden rounded-xl ring-1 ring-inset sm:aspect-auto sm:w-48 sm:self-stretch lg:aspect-[2.4/1] lg:w-full`}
      >
        <Cover
          project={project}
          sizes={RECENT_COVER_SIZES}
          fit="object-cover"
          priority={priority}
        />
      </ScrollDepth>
      <div
        className={`${layoutStyles.recentContent} ${actionStyles.recentContent} flex min-w-0 flex-1 flex-col`}
      >
        <div className={actionStyles.recentText}>
          <div className="flex min-w-0 items-baseline justify-between gap-2">
            <h3
              title={project.title}
              className="min-w-0 truncate text-[15px] leading-snug font-semibold"
            >
              {project.title}
            </h3>
            {(project.language || project.tags[0]) && (
              <div className="flex shrink-0 items-center gap-1">
                <span className={PRIMARY_TAG}>{project.language || project.tags[0]}</span>
                {(project.language
                  ? project.tags.find(
                      (tag) => tag.toLowerCase() !== project.language?.toLowerCase(),
                    )
                  : project.tags[1]) && (
                  <span
                    className={`${actionStyles.recentExtraTag} border-border text-muted rounded-full border bg-(--chip-surface) px-1.5 py-0.5 text-[10px] leading-tight`}
                  >
                    {project.language
                      ? project.tags.find(
                          (tag) => tag.toLowerCase() !== project.language?.toLowerCase(),
                        )
                      : project.tags[1]}
                  </span>
                )}
              </div>
            )}
          </div>
          {(project.forks ?? 0) > 0 && <Stats project={project} />}
          {cardDescription(project) && (
            <p
              className={`${actionStyles.recentDescription} text-muted mt-1.5 line-clamp-2 text-sm leading-relaxed text-pretty`}
            >
              {cardDescription(project)}
            </p>
          )}
        </div>
        <div className={`${actionStyles.recentFooter} mt-auto`}>
          <ProjectComponents project={project} />
          <Actions project={project} onQuickView={onQuickView} compact />
        </div>
      </div>
    </article>
  );
}
