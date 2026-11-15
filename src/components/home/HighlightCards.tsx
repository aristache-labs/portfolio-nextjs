"use client";

import { cardDescription, pushedLabel, type ProjectPresentation } from "@/lib/project-presentation";
import { ProjectComponents } from "./ProjectComponents";
import { CardBorderGlow } from "@/components/ui/CardBorderGlow";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type MouseEventHandler,
  type ReactNode,
} from "react";

import actionStyles from "./project-actions.module.css";
import motionStyles from "./project-motion.module.css";
import layoutStyles from "./projects-layout.module.css";

import Image from "next/image";
import { useProjectCoversReady } from "./ProjectCoverGate";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Github,
  Maximize2,
  Pause,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { MergedProject } from "@/lib/projects";
import { COMPACT_PROJECT_ACTION, GLASS_CARD } from "./project-styles";

// The hero frame is about two thirds of the container on desktop and full width below it. The
// small previews are thumbnails. Lazy covers use their real layout width where `auto` is supported.
const HERO_COVER_SIZES = "(min-width: 1024px) 1000px, 100vw";
const COMPACT_COVER_SIZES = "(min-width: 1024px) 480px, 144px";

/** The poster fills its frame edge to edge. Frames use the real poster ratios (hero 1600x950, the rest 1600x900) so nothing is cropped; spare height goes to the text area. */
const FIT = "object-cover object-center";

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
  spacing,
}: {
  project: MergedProject;
  onQuickView: MouseEventHandler<HTMLButtonElement>;
  compact?: boolean;
  /** Top margin; defaults to the card's own rhythm. */
  spacing?: string;
}) {
  const githubUrl = project.htmlUrl ?? `https://github.com/aristache-labs/${project.repo}`;
  const compactClass = compact ? COMPACT_PROJECT_ACTION : undefined;
  return (
    <div
      className={`${actionStyles.actions} ${compact ? `${actionStyles.recent} ${actionStyles.compact} ${spacing ?? "mt-2"}` : `${actionStyles.featured} mt-4`} flex flex-wrap items-center gap-2`}
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
          <span className={actionStyles.liveLabel}>Live</span>
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
        className={`${layoutStyles.featuredCard} ${SHELL} flex items-center gap-3 p-3.5 lg:items-stretch lg:gap-3 lg:p-2`}
      >
        <CardBorderGlow />
        <Frame
          className={`${layoutStyles.asideMedia} aspect-[4/3] w-[5.25rem] shrink-0 lg:w-[58%] lg:max-w-none lg:self-center`}
        >
          <Cover project={project} sizes={COMPACT_COVER_SIZES} />
        </Frame>
        {/* The whole block (title, description, actions) is centred next to the poster at its natural height. */}
        <div
          className={`${layoutStyles.featuredDetails} flex min-w-0 flex-1 flex-col justify-center lg:pr-1.5`}
        >
          <h3 className="line-clamp-2 text-base leading-snug font-semibold break-words lg:text-lg">
            {project.title}
          </h3>
          {description && (
            <p className="text-muted mt-2 line-clamp-3 text-sm leading-relaxed text-pretty max-lg:hidden">
              {description}
            </p>
          )}
          <ProjectComponents project={project} />
          <Actions project={project} onQuickView={onQuickView} compact spacing="mt-2 lg:mt-5" />
        </div>
      </article>
    );
  return (
    <article className={`${layoutStyles.featuredCard} ${SHELL} flex flex-col gap-4 p-3`}>
      <CardBorderGlow />
      <Frame className={`${layoutStyles.heroFrame} aspect-[2/1] w-full flex-1`}>
        <Cover project={project} sizes={HERO_COVER_SIZES} loading={eager ? "eager" : "lazy"} />
      </Frame>
      <div className={`${layoutStyles.featuredDetails} flex shrink-0 flex-col px-1 pb-1`}>
        <h3 className="text-xl leading-snug font-semibold break-words">{project.title}</h3>
        {heroDescription && (
          <p
            className={`${layoutStyles.heroText} text-muted mt-2 line-clamp-2 text-sm leading-relaxed text-pretty`}
          >
            {heroDescription}
          </p>
        )}
        <ProjectComponents project={project} />
        <Actions project={project} onQuickView={onQuickView} />
      </div>
    </article>
  );
}

export function FeaturedShowcase({
  projects,
  label,
  reducedMotion,
  onQuickView,
}: {
  projects: ProjectPresentation[];
  label: ReactNode;
  reducedMotion: boolean;
  onQuickView: (project: ProjectPresentation, event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | undefined>(undefined);
  const [active, setActive] = useState(0);
  const [settledSlide, setSettledSlide] = useState<number | null>(null);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);
  const autoplay = !reducedMotion && !paused && projects.length > 1;

  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  const moveTo = useCallback(
    (index: number, instant = reducedMotion) => {
      const element = track.current;
      if (!element || index < 0 || index >= projects.length) return;
      element.scrollTo({
        left: index * element.clientWidth,
        behavior: instant ? "instant" : "smooth",
      });
    },
    [projects.length, reducedMotion],
  );

  useEffect(() => {
    if (!track.current || typeof IntersectionObserver !== "function") return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.intersectionRatio >= 0.6),
      { threshold: 0.6 },
    );
    observer.observe(track.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!autoplay || !inView) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      const next = (active + 1) % projects.length;
      moveTo(next, next === 0);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [active, autoplay, inView, moveTo, projects.length]);

  function navigate(index: number) {
    setPaused(true);
    moveTo(index);
  }

  return (
    <div role="region" aria-label="Featured projects">
      <div className={layoutStyles.showcaseHeader}>
        {label}
        {projects.length > 1 && (
          <div className={layoutStyles.showcaseControls}>
            <span role="status" aria-live={autoplay ? "off" : "polite"}>
              {active + 1} / {projects.length}
              <span className="sr-only"> {projects[active]?.title}</span>
            </span>
            {!reducedMotion && (
              <Button
                variant="secondary"
                size="sm"
                aria-label={paused ? "Play featured projects" : "Pause featured projects"}
                onClick={() => setPaused(!paused)}
              >
                {paused ? <Play size={15} aria-hidden /> : <Pause size={15} aria-hidden />}
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              aria-label="Previous featured project"
              aria-disabled={active === 0}
              onFocus={() => setPaused(true)}
              onClick={() => navigate(active - 1)}
            >
              <ChevronLeft size={18} aria-hidden />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              aria-label="Next featured project"
              aria-disabled={active === projects.length - 1}
              onFocus={() => setPaused(true)}
              onClick={() => navigate(active + 1)}
            >
              <ChevronRight size={18} aria-hidden />
            </Button>
          </div>
        )}
      </div>
      <div
        ref={track}
        className={layoutStyles.showcaseTrack}
        onPointerDown={() => setPaused(true)}
        onFocusCapture={() => setPaused(true)}
        onScroll={({ currentTarget }) => {
          const { scrollLeft, clientWidth } = currentTarget;
          const index = Math.max(
            0,
            Math.min(projects.length - 1, Math.round(scrollLeft / clientWidth)),
          );
          if (index !== active) setActive(index);
          if (reducedMotion) return;

          window.clearTimeout(settleTimer.current);
          settleTimer.current = window.setTimeout(() => {
            setSettledSlide((previous) => (previous === null && index === 0 ? null : index));
          }, 100);
        }}
      >
        {projects.map((project, index) => {
          const description = cardDescription(project);
          return (
            <div key={project.id} className={layoutStyles.showcaseSlide} inert={index !== active}>
              <article className={`${SHELL} ${layoutStyles.showcaseCard}`}>
                <Frame className={layoutStyles.showcaseMedia}>
                  <Cover project={project} sizes="60vw" loading={index === 0 ? "eager" : "lazy"} />
                </Frame>
                <div className={layoutStyles.showcaseCopy}>
                  <div
                    className={layoutStyles.showcaseText}
                    data-awaiting-rise={
                      !reducedMotion && index !== (settledSlide ?? 0) ? "" : undefined
                    }
                    data-rise={!reducedMotion && settledSlide === index ? "" : undefined}
                  >
                    {(project.category || project.language) && (
                      <p className={layoutStyles.showcaseCategory}>
                        {project.category || project.language}
                      </p>
                    )}
                    <h3>{project.title}</h3>
                    {description && (
                      <p className={layoutStyles.showcaseDescription}>{description}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={(event) => onQuickView(project, event)}
                    aria-label={`View ${project.title}`}
                    leftIcon={<Maximize2 size={14} aria-hidden />}
                  >
                    View project
                  </Button>
                </div>
              </article>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Horizontal card sized by its own width (container query). Wide: thumbnail, title and metadata
 * grouped beside it, actions on the right, both centred. Narrow: the actions drop below the
 * metadata, aligned with the title.
 */
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
    <article
      className={`${layoutStyles.recentCard} ${SHELL} @container grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 border-white/5! p-3 sm:p-3.5 @[34rem]:grid-cols-[auto_minmax(0,1fr)_auto] @[34rem]:gap-x-4`}
    >
      <CardBorderGlow variant="subtle" />
      <Frame
        className={`${layoutStyles.recentMedia} row-span-2 aspect-[4/3] w-[5.25rem] self-center @[34rem]:row-span-1 @[34rem]:w-36`}
      >
        <Cover project={project} sizes={COMPACT_COVER_SIZES} />
      </Frame>
      <div className="min-w-0">
        <h3 title={project.title} className="truncate text-[15px] leading-snug font-semibold">
          {project.title}
        </h3>
        {meta && <p className="text-muted mt-1.5 truncate text-xs">{meta}</p>}
        <ProjectComponents project={project} />
      </div>
      <Actions
        project={project}
        onQuickView={onQuickView}
        compact
        spacing="col-start-2 mt-3 @[34rem]:col-start-3 @[34rem]:row-start-1 @[34rem]:mt-0 @[34rem]:flex-nowrap @[34rem]:self-center"
      />
    </article>
  );
}
