"use client";

import Image from "next/image";
import { ExternalLink, GitFork, Github, Maximize2, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { MergedProject } from "@/lib/projects";
import { pluralize } from "@/utils/plural";

/** "Oct 2026". Fixed to UTC so the server render and the browser agree on the month. */
export function formatUpdated(date: Date): string {
  return date.toLocaleDateString("en", { month: "short", year: "numeric", timeZone: "UTC" });
}

function Cover({ project, sizes, fit }: { project: MergedProject; sizes: string; fit: string }) {
  return project.coverImage ? (
    <Image
      src={project.coverImage}
      alt=""
      fill
      sizes={sizes}
      className={`${fit} transition-transform duration-500 motion-safe:group-hover:scale-105`}
    />
  ) : (
    <div className="size-full bg-(image:--gradient-brand) opacity-70" />
  );
}

function MetaLine({ label, project }: { label: string; project: MergedProject }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="text-[0.65rem] font-semibold tracking-wider text-(--accent-on-chip) uppercase">
        {label}
      </span>
      <span aria-hidden className="text-muted text-xs">
        ·
      </span>
      <Stats project={project} />
    </div>
  );
}

function Stats({ project }: { project: MergedProject }) {
  return (
    <div className="text-muted flex shrink-0 items-center gap-3 text-xs">
      <span className="flex items-center gap-1" aria-label={pluralize(project.stars ?? 0, "star")}>
        <Star className="size-3.5" aria-hidden /> {project.stars ?? "—"}
      </span>
      <span className="flex items-center gap-1" aria-label={pluralize(project.forks ?? 0, "fork")}>
        <GitFork className="size-3.5" aria-hidden /> {project.forks ?? "—"}
      </span>
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
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {project.language && (
        <span className="rounded-full border border-(--brand-deep)/40 bg-(--chip-surface) px-2 py-0.5 text-[11px] font-semibold text-(--accent-on-chip)">
          {project.language}
        </span>
      )}
      {project.tags.map((tag) => (
        <span
          key={tag}
          className="border-border text-muted rounded-full border bg-(--chip-surface) px-2 py-0.5 text-[11px]"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function Actions({ project, onQuickView }: { project: MergedProject; onQuickView: () => void }) {
  const githubUrl = project.htmlUrl ?? `https://github.com/aristache-labs/${project.repo}`;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        onClick={onQuickView}
        leftIcon={<Maximize2 className="size-3.5" aria-hidden />}
      >
        Quick view
      </Button>
      <Button
        href={githubUrl}
        variant="secondary"
        size="sm"
        target="_blank"
        rel="noopener noreferrer"
        leftIcon={<Github className="size-3.5" aria-hidden />}
      >
        Code
      </Button>
      {project.homepage && (
        <Button
          href={project.homepage}
          variant="ghost"
          size="sm"
          target="_blank"
          rel="noopener noreferrer"
          leftIcon={<ExternalLink className="size-3.5" aria-hidden />}
        >
          Live
        </Button>
      )}
    </div>
  );
}

const SHELL =
  "border-border bg-surface group relative h-full w-full overflow-hidden rounded-2xl border backdrop-blur-sm transition-colors hover:border-(--brand-deep)/40";

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
      <div className="relative aspect-16/9 overflow-hidden lg:aspect-auto lg:h-64 lg:flex-1">
        <Cover project={project} sizes="(max-width: 1024px) 100vw, 50vw" fit="object-fill" />
      </div>
      <div className="p-4 sm:p-5">
        <MetaLine label="Featured" project={project} />
        <h3 className="mt-1.5 line-clamp-1 text-lg leading-snug font-bold">{project.title}</h3>
        {project.description && (
          <p className="text-muted mt-1 line-clamp-2 text-sm text-pretty">{project.description}</p>
        )}
        <Tags project={project} />
        <Actions project={project} onQuickView={onQuickView} />
      </div>
    </article>
  );
}

/** Compact card: preview on the left, then the update line, title, description and actions. */
export function RecentCard({
  project,
  onQuickView,
}: {
  project: MergedProject;
  onQuickView: () => void;
}) {
  return (
    <article className={`${SHELL} flex flex-row items-stretch gap-3 p-3 sm:gap-4 sm:p-3`}>
      <div className="relative w-24 shrink-0 self-stretch overflow-hidden rounded-xl sm:w-50">
        <Cover project={project} sizes="128px" fit="object-fill" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <MetaLine
          label={project.pushedAt ? `Updated ${formatUpdated(project.pushedAt)}` : "Project"}
          project={project}
        />
        <h3 className="mt-1.5 line-clamp-1 text-base leading-snug font-bold">{project.title}</h3>
        {project.description && (
          <p className="text-muted mt-1 line-clamp-2 text-xs text-pretty sm:text-sm">
            {project.description}
          </p>
        )}
        <Tags project={project} />
        <div className="mt-auto">
          <Actions project={project} onQuickView={onQuickView} />
        </div>
      </div>
    </article>
  );
}
