"use client";

import actionStyles from "./project-actions.module.css";

import Image from "next/image";
import { ExternalLink, GitFork, Github, Maximize2, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { MergedProject } from "@/lib/projects";
import { pluralize } from "@/utils/plural";
import { COMPACT_PROJECT_ACTION } from "./project-styles";

// Fallbacks follow site-container padding and the two-column highlights layout.
// Lazy covers use their actual layout width when the browser supports auto sizes.
const FEATURED_COVER_SIZES = [
  "(min-width: 1024px) calc((min(100vw, 86rem) - clamp(3rem, 5vw, 5.5rem) - 1.5rem) / 2)",
  "(orientation: landscape) and (max-height: 500px) calc((100vw - clamp(3rem, 5vw, 5.5rem) - 1rem) / 2)",
  "calc(100vw - clamp(3rem, 5vw, 5.5rem))",
].join(", ");

const RECENT_COVER_SIZES = [
  "(orientation: portrait) and (max-width: 1023px) 80px",
  "(orientation: landscape) and (max-width: 1023px) and (max-height: 500px) and (pointer: coarse) calc(18vw)",
  "(min-width: 1024px) calc((min(100vw, 86rem) - clamp(3rem, 5vw, 5.5rem) - 3.5rem) / 4 - 1.5rem)",
  "(min-width: 640px) 192px",
  "(orientation: landscape) and (max-height: 500px) calc((100vw - clamp(3rem, 5vw, 5.5rem) - 1rem) / 2 - 1.75rem)",
  "calc(100vw - clamp(3rem, 5vw, 5.5rem) - 1.75rem)",
].join(", ");

const UPDATED_DATE_FORMATTER = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "Oct 2026". Fixed to UTC so the server render and the browser agree on the month. */
export function formatUpdated(date: Date): string {
  return Number.isNaN(date.getTime()) ? "Invalid Date" : UPDATED_DATE_FORMATTER.format(date);
}

function Cover({
  project,
  sizes,
  fit,
  priority = false,
}: {
  project: MergedProject;
  sizes: string;
  fit: string;
  priority?: boolean;
}) {
  return project.coverImage ? (
    <Image
      src={project.coverImage}
      alt=""
      fill
      sizes={priority ? sizes : `auto, ${sizes}`}
      loading={priority ? undefined : "lazy"}
      quality={90}
      priority={priority}
      className={`${fit} transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.02]`}
    />
  ) : (
    <div className="size-full bg-(image:--gradient-brand) opacity-70" />
  );
}

function Stats({ project }: { project: MergedProject }) {
  return (
    <div className="text-muted flex shrink-0 items-center gap-3 text-xs">
      {(project.stars ?? 0) > 0 && (
        <span
          className="flex items-center gap-1"
          aria-label={pluralize(project.stars ?? 0, "star")}
        >
          <Star className="size-3.5" aria-hidden /> {project.stars ?? "—"}
        </span>
      )}
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
const PRIMARY_TAG =
  "shrink-0 rounded-full border border-(--brand-deep)/40 bg-(--chip-surface) px-1.5 py-0.5 text-[10px] leading-tight font-semibold text-(--accent-on-chip)";

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
  onQuickView: () => void;
  compact?: boolean;
}) {
  const githubUrl = project.htmlUrl ?? `https://github.com/aristache-labs/${project.repo}`;
  const compactClass = compact ? COMPACT_PROJECT_ACTION : undefined;
  return (
    <div
      className={`${actionStyles.actions} ${compact ? `${actionStyles.recent} mt-2` : `${actionStyles.featured} mt-4`} flex flex-wrap items-center gap-2`}
    >
      <Button
        className={compactClass}
        size="sm"
        onClick={onQuickView}
        leftIcon={<Maximize2 className="size-3.5" aria-hidden />}
      >
        View
      </Button>
      <Button
        href={githubUrl}
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
        <span className="sr-only">Code</span>
      </Button>
      {project.homepage && (
        <Button
          href={project.homepage}
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
      {compact && project.pushedAt && (
        <time
          dateTime={project.pushedAt.toISOString()}
          className="text-muted ml-auto shrink-0 rounded-md border border-white/10 bg-white/3 px-2 py-1 text-[10px] tracking-[0.04em] uppercase"
        >
          {formatUpdated(project.pushedAt)}
        </time>
      )}
    </div>
  );
}

const SHELL =
  "border-border bg-surface group relative h-full w-full overflow-hidden rounded-2xl border backdrop-blur-sm transition-colors duration-300 hover:border-(--brand-mid)/40";

/** Big card: preview on top, then title, a short description, tags and actions. */
export function FeaturedCard({
  project,
  onQuickView,
}: {
  project: MergedProject;
  onQuickView: () => void;
}) {
  return (
    <article className={`${SHELL} flex flex-col`}>
      <span className="pointer-events-none absolute top-[25px] -right-[39px] z-20 flex h-[30px] w-[160px] rotate-45 items-center justify-center border-y border-(--brand-mid)/50 bg-(--brand-deep) text-[11px] font-bold tracking-[0.12em] text-white shadow-sm">
        FEATURED
      </span>
      <div className="border-border relative aspect-video w-full shrink-0 overflow-hidden border-b">
        <Cover project={project} sizes={FEATURED_COVER_SIZES} fit="object-cover" />
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div
          className={`${actionStyles.featuredHeading} flex flex-wrap items-center justify-between gap-x-3 gap-y-2`}
        >
          <h3 className="max-w-full min-w-0 text-lg leading-snug font-bold break-words">
            {project.title}
          </h3>
          <Tags project={project} />
        </div>
        {((project.stars ?? 0) > 0 || (project.forks ?? 0) > 0) && (
          <div className="mt-2">
            <Stats project={project} />
          </div>
        )}
        {project.description && (
          <p
            className={`${actionStyles.featuredDescription} text-muted mt-2 line-clamp-2 text-sm leading-relaxed text-pretty lg:line-clamp-3`}
          >
            {project.description}
          </p>
        )}
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
}: {
  project: MergedProject;
  onQuickView: () => void;
  priority?: boolean;
}) {
  return (
    <article
      className={`${actionStyles.recentCard} ${SHELL} flex flex-col gap-3.5 p-3.5 sm:flex-row sm:items-stretch sm:p-4 lg:flex-col lg:p-3`}
    >
      <div
        className={`${actionStyles.recentImage} ring-border relative aspect-video w-full shrink-0 overflow-hidden rounded-xl ring-1 ring-inset sm:aspect-auto sm:w-48 sm:self-stretch lg:aspect-[2.4/1] lg:w-full`}
      >
        <Cover
          project={project}
          sizes={RECENT_COVER_SIZES}
          fit="object-cover"
          priority={priority}
        />
      </div>
      <div className={`${actionStyles.recentContent} flex min-w-0 flex-1 flex-col`}>
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
          {((project.stars ?? 0) > 0 || (project.forks ?? 0) > 0) && <Stats project={project} />}
          {project.description && (
            <p
              className={`${actionStyles.recentDescription} text-muted mt-1.5 line-clamp-2 text-sm leading-relaxed text-pretty`}
            >
              {project.description}
            </p>
          )}
        </div>
        <div className={`${actionStyles.recentFooter} mt-auto`}>
          <Actions project={project} onQuickView={onQuickView} compact />
        </div>
      </div>
    </article>
  );
}
