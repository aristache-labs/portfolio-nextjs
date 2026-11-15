"use client";

import { cardDescription, pushedLabel } from "@/lib/project-presentation";
import { ProjectComponents } from "./ProjectComponents";
import { CardBorderGlow } from "@/components/ui/CardBorderGlow";

import type { MouseEventHandler, ReactNode } from "react";

import actionStyles from "./project-actions.module.css";
import motionStyles from "./project-motion.module.css";
import layoutStyles from "./projects-layout.module.css";

import Image from "next/image";
import { useProjectCoversReady } from "./ProjectCoverGate";
import { ExternalLink, Github, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { MergedProject } from "@/lib/projects";
import { COMPACT_PROJECT_ACTION, GLASS_CARD } from "./project-styles";

// The hero frame is about two thirds of the container on desktop and full width below it. The
// small previews are thumbnails. Lazy covers use their real layout width where `auto` is supported.
const HERO_COVER_SIZES = "(min-width: 1024px) 640px, 100vw";
const COMPACT_COVER_SIZES = "(min-width: 1024px) 420px, 144px";

/** Whole screenshot, never cropped: `contain` inside a dark inset frame. */
const FIT = "object-contain";

function Cover({
  project,
  sizes,
  loading = "lazy",
}: {
  project: MergedProject;
  sizes: string;
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
            alt={`${project.title} preview`}
            loading="lazy"
            className={`absolute inset-0 size-full ${FIT}`}
          />
        </noscript>
      </>
    );
  return project.coverImage ? (
    <Image
      src={project.coverImage}
      alt={`${project.title} preview`}
      fill
      sizes={loading === "eager" ? sizes : `auto, ${sizes}`}
      loading={loading}
      // Card covers render at thumbnail size; the default quality is visually identical there
      // and roughly a third lighter. Quick View keeps 90 for full-width screenshots.
      fetchPriority="low"
      className={`${motionStyles.cover} ${FIT}`}
    />
  ) : (
    <div className="size-full bg-(image:--gradient-brand) opacity-70" />
  );
}

function Frame({ className, children }: { className: string; children: ReactNode }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-white/8 bg-black/35 ${className}`}
    >
      {children}
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
    </div>
  );
}

const SHELL = `${GLASS_CARD} ${motionStyles.card} group relative h-full w-full overflow-hidden rounded-2xl border transition-colors duration-300 hover:border-(--brand-mid)/40`;

/**
 * Featured card. `hero` is the large one: a centred screenshot in an inset frame, then title,
 * a short description and the actions. `compact` is the framed preview beside title and actions.
 */
export function FeaturedCard({
  project,
  onQuickView,
  variant = "hero",
  eager = false,
}: {
  project: MergedProject;
  onQuickView: MouseEventHandler<HTMLButtonElement>;
  variant?: "hero" | "compact";
  eager?: boolean;
}) {
  const description = cardDescription(project);
  // The hero has room for the full text, trimmed by line-clamp; the short pitch is the fallback.
  const heroDescription = project.description?.trim().replace(/\s+/g, " ") || description;
  // Below 1024px the secondary cards are image-and-text rows; from 1024px they become full cards
  // like the hero (poster, title, short description, actions).
  if (variant === "compact")
    return (
      <article
        className={`${layoutStyles.featuredCard} ${SHELL} flex items-center gap-3 p-3.5 lg:flex-col lg:items-stretch lg:gap-4 lg:p-5`}
      >
        <CardBorderGlow />
        <Frame className="aspect-[4/3] w-[38%] max-w-56 shrink-0 lg:aspect-[23/10] lg:w-full lg:max-w-none lg:flex-1">
          <Cover project={project} sizes={COMPACT_COVER_SIZES} />
        </Frame>
        <div className="flex min-w-0 flex-1 flex-col lg:flex-none">
          <h3 className="line-clamp-2 text-base leading-snug font-semibold break-words lg:text-xl">
            {project.title}
          </h3>
          {description && (
            <p className="text-muted mt-1.5 line-clamp-2 hidden text-sm leading-relaxed text-pretty lg:block">
              {description}
            </p>
          )}
          <ProjectComponents project={project} />
          <Actions project={project} onQuickView={onQuickView} compact />
        </div>
      </article>
    );
  return (
    <article className={`${layoutStyles.featuredCard} ${SHELL} flex flex-col gap-4 p-4 sm:p-5`}>
      <CardBorderGlow />
      <Frame className={`${layoutStyles.heroFrame} aspect-video w-full`}>
        <Cover project={project} sizes={HERO_COVER_SIZES} loading={eager ? "eager" : "lazy"} />
      </Frame>
      <div className="flex flex-1 flex-col">
        <h3 className="text-xl leading-snug font-semibold break-words lg:text-2xl">
          {project.title}
        </h3>
        {heroDescription && (
          <p className="text-muted mt-2 line-clamp-3 text-sm leading-relaxed text-pretty lg:line-clamp-6 lg:text-base">
            {heroDescription}
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

/** Horizontal card: compact framed preview, then title, metadata and a visible action. */
export function RecentCard({
  project,
  onQuickView,
}: {
  project: MergedProject;
  onQuickView: MouseEventHandler<HTMLButtonElement>;
}) {
  const meta = [
    project.category || project.language,
    project.pushedAt && pushedLabel(project.pushedAt),
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <article className={`${layoutStyles.recentCard} ${SHELL} flex items-center gap-3 p-3 sm:p-3.5`}>
      <CardBorderGlow />
      <Frame className="aspect-[4/3] w-20 shrink-0 sm:w-36">
        <Cover project={project} sizes={COMPACT_COVER_SIZES} />
      </Frame>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 title={project.title} className="truncate text-[15px] leading-snug font-semibold">
          {project.title}
        </h3>
        {meta && <p className="text-muted mt-0.5 truncate text-xs">{meta}</p>}
        <ProjectComponents project={project} />
        <Actions project={project} onQuickView={onQuickView} compact />
      </div>
    </article>
  );
}
