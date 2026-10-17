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
      sizes={sizes}
      priority={priority}
      className={`${fit} transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.02]`}
    />
  ) : (
    <div className="size-full bg-(image:--gradient-brand) opacity-70" />
  );
}

function MetaLine({ label, project }: { label: string; project: MergedProject }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="text-xs font-semibold tracking-wider text-(--accent-on-chip) uppercase">
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
        <span className="rounded-full border border-(--brand-deep)/40 bg-(--chip-surface) px-2 py-0.5 text-xs font-semibold text-(--accent-on-chip)">
          {project.language}
        </span>
      )}
      {project.tags.map((tag) => (
        <span
          key={tag}
          className="border-border text-muted rounded-full border bg-(--chip-surface) px-2 py-0.5 text-xs"
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
    <div className="mt-4 flex flex-wrap items-center gap-2">
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
      <div className="border-border relative aspect-video w-full shrink-0 overflow-hidden border-b">
        <Cover project={project} sizes="(max-width: 1024px) 100vw, 36rem" fit="object-cover" />
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <MetaLine label="Featured" project={project} />
        <h3 className="mt-2 line-clamp-1 text-lg leading-snug font-bold">{project.title}</h3>
        {project.description && (
          <p className="text-muted mt-2 line-clamp-2 text-sm leading-relaxed text-pretty">
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

/** Compact card: preview on the left, then the update line, title, description and actions. */
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
    <article className={`${SHELL} flex flex-col gap-3.5 p-3.5 sm:flex-row sm:items-stretch sm:p-4`}>
      <div className="ring-border relative aspect-video w-full shrink-0 overflow-hidden rounded-xl ring-1 ring-inset sm:aspect-auto sm:w-48 sm:self-stretch">
        <Cover
          project={project}
          sizes="(max-width: 640px) 100vw, 192px"
          fit="object-cover"
          priority={priority}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <MetaLine
          label={project.pushedAt ? `Updated ${formatUpdated(project.pushedAt)}` : "Project"}
          project={project}
        />
        <h3 className="mt-1.5 line-clamp-1 text-[1.0625rem] leading-snug font-bold">
          {project.title}
        </h3>
        {project.description && (
          <p className="text-muted mt-1.5 line-clamp-2 text-sm leading-relaxed text-pretty">
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
