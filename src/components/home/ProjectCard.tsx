"use client";

import actionStyles from "./project-actions.module.css";

import { Star, GitFork, ExternalLink, Github, Maximize2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { MergedProject } from "@/lib/projects";
import { pluralize } from "@/utils/plural";
import { COMPACT_PROJECT_ACTION, COMPACT_PROJECT_TAGS } from "./project-styles";

export type { MergedProject };

export function ProjectCard({
  project,
  onQuickView,
}: {
  project: MergedProject;
  onQuickView?: () => void;
}) {
  const githubUrl = project.htmlUrl ?? `https://github.com/aristache-labs/${project.repo}`;
  const blurb = project.description ?? "";

  return (
    <Card
      as="article"
      className="group bg-surface relative flex h-full flex-col overflow-hidden border-(--brand-mid)/30 p-5 backdrop-blur-sm transition-colors duration-300 hover:border-(--brand-mid)/55"
    >
      <div className="relative z-10 flex flex-1 flex-col">
        {/* Featured badge: more projects are flagged featured than the showcase above
            can hold, so the ones that land in the grid still say so. */}
        {project.featured && (
          <p className="mb-2 text-[0.65rem] font-semibold tracking-wider text-(--accent-on-chip) uppercase">
            Featured
          </p>
        )}

        {/* Title + stats row */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-[15px] leading-snug font-semibold">{project.title}</h3>
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
        </div>

        {/* Description */}
        {blurb && (
          <p className="text-muted mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-pretty lg:line-clamp-3">
            {blurb}
          </p>
        )}

        {/* Tech tags */}
        {(project.language || project.tags.length > 0) && (
          <div className={`${COMPACT_PROJECT_TAGS} mt-2.5 flex flex-wrap gap-1.5`}>
            {project.language && (
              // Opaque brand-tinted chip: --chip-surface is a subtle violet
              // wash (not flat black) that blocks the moving ambient gradient
              // from bleeding through, so the accent text stays legible.
              <span className="rounded-full border border-(--brand-deep)/40 bg-(--chip-surface) px-2 py-0.5 text-xs font-semibold text-(--accent-on-chip)">
                {project.language}
              </span>
            )}
            {project.tags.map((t) => (
              <span
                key={t}
                className="border-border text-muted rounded-full border bg-(--chip-surface) px-2 py-0.5 text-xs"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Action links */}
        <div className={`${actionStyles.actions} mt-auto flex flex-wrap items-center gap-2 pt-4`}>
          {onQuickView && (
            <Button
              className={COMPACT_PROJECT_ACTION}
              size="sm"
              onClick={onQuickView}
              leftIcon={<Maximize2 className="size-3.5" aria-hidden />}
            >
              View
            </Button>
          )}
          <Button
            className={COMPACT_PROJECT_ACTION}
            href={githubUrl}
            title="View code on GitHub"
            variant="secondary"
            size="sm"
            target="_blank"
            rel="noopener noreferrer"
            leftIcon={<Github className="size-3.5" aria-hidden />}
          >
            <span className="sr-only">Code</span>
          </Button>
          {project.homepage && (
            <Button
              className={COMPACT_PROJECT_ACTION}
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
      </div>
    </Card>
  );
}
