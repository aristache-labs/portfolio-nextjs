"use client";

import { cardDescription, pushedLabel, type ProjectPresentation } from "@/lib/project-presentation";
import { ProjectComponents } from "./ProjectComponents";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
  type MouseEventHandler,
  type ReactNode,
} from "react";

import motionStyles from "./project-motion.module.css";
import layoutStyles from "./projects-layout.module.css";

import Image from "next/image";
import { useProjectCoversReady } from "./ProjectCoverGate";
import {
  ChevronLeft,
  ChevronRight,
  CircleDot,
  CodeXml,
  Link,
  Github,
  GitPullRequest,
  Inbox,
  Eye,
  Menu,
  Pause,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { MergedProject } from "@/lib/projects";

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
  intrinsic = false,
}: {
  project: MergedProject;
  sizes: string;
  loading?: "eager" | "lazy";
  intrinsic?: boolean;
}) {
  const ready = useProjectCoversReady();
  const placeholderSize = intrinsic ? "aspect-video w-full" : "size-full";
  const imageSize = intrinsic ? "block h-auto w-full object-contain" : FIT;
  if (project.coverImage && !ready)
    return (
      <>
        <span className={`block ${placeholderSize} bg-white/3`} />
        <noscript>
          {/* Native fallback is intentionally outside Next image optimization when JS is off. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.coverImage}
            alt={`${project.title} preview`}
            loading="lazy"
            className={intrinsic ? imageSize : `absolute inset-0 size-full ${FIT}`}
          />
        </noscript>
      </>
    );
  return project.coverImage ? (
    <Image
      src={project.coverImage}
      alt={`${project.title} preview`}
      {...(intrinsic ? { width: 1600, height: 900 } : { fill: true })}
      sizes={loading === "eager" ? sizes : `auto, ${sizes}`}
      loading={loading}
      // Card covers render at thumbnail size; the default quality is visually identical there
      // and roughly a third lighter. Quick View keeps 90 for full-width screenshots.
      fetchPriority="low"
      className={intrinsic ? imageSize : `${motionStyles.cover} ${imageSize}`}
    />
  ) : (
    <span className={`block ${placeholderSize} bg-(image:--gradient-brand) opacity-70`} />
  );
}

const FRAME = "relative overflow-hidden rounded-xl border border-white/8 bg-black/35";

function PosterEye() {
  return (
    <span className={layoutStyles.repoView} aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </span>
  );
}

function Frame({
  className,
  children,
  title,
  label = `Open preview for ${title}`,
  onQuickView,
}: {
  className: string;
  children: ReactNode;
  title: string;
  label?: string;
  onQuickView: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      className={`${FRAME} ${className} ${layoutStyles.posterTrigger} focus-visible:outline-ring cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2`}
      aria-label={label}
      onClick={onQuickView}
    >
      {children}
      <PosterEye />
    </button>
  );
}

const GITHUB_OWNER = "aristache-labs";
const CARD = `${motionStyles.card} group relative h-full w-full overflow-hidden rounded-2xl border`;

/**
 * Featured card in the same GitHub style as the Recently updated cards. Phones and tablets: poster,
 * then title with category, description and the Live / Code / Issues / Pull requests row. Desktop
 * with a pointer: the poster fills the card and everything else shows over it on hover. `compact`
 * is the same card for the two smaller slots.
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
  const hero = variant === "hero";
  const description = hero
    ? project.description?.trim().replace(/\s+/g, " ") || cardDescription(project)
    : cardDescription(project);
  const repoUrl = (project.htmlUrl ?? `https://github.com/${GITHUB_OWNER}/${project.repo}`).replace(
    /\/+$/,
    "",
  );
  const category = project.category;
  const link = (suffix: string, label: string, icon: ReactNode, className?: string) => (
    <Button
      className={className}
      href={`${repoUrl}${suffix}`}
      aria-label={`${label} for ${project.title}`}
      variant="ghost"
      size="sm"
      target="_blank"
      rel="noopener noreferrer"
      leftIcon={icon}
    >
      <span className={layoutStyles.heroLabel}>{label}</span>
    </Button>
  );
  return (
    <article className={`${layoutStyles.heroCard} ${hero ? "" : layoutStyles.heroCompact} ${CARD}`}>
      <Frame
        title={project.title}
        label={`View ${project.title}`}
        onQuickView={onQuickView}
        className={`${layoutStyles.heroMedia} w-full`}
      >
        <Cover
          project={project}
          sizes={hero ? HERO_COVER_SIZES : COMPACT_COVER_SIZES}
          loading={eager ? "eager" : "lazy"}
          intrinsic
        />
      </Frame>
      <div className={layoutStyles.heroBody}>
        <div className={layoutStyles.heroTitle}>
          <h3>{project.title}</h3>
          {category && (
            <span className={layoutStyles.repoBadge} data-category={category} title={category}>
              {category}
            </span>
          )}
        </div>
        {description && <p className={layoutStyles.heroText}>{description}</p>}
        <ProjectComponents project={project} />
        <div className={layoutStyles.heroActions}>
          <div className={layoutStyles.heroLinks}>
            <button
              type="button"
              className={layoutStyles.heroRowView}
              aria-label={`View ${project.title}`}
              onClick={onQuickView}
            >
              <Eye size={13} aria-hidden />
              View
            </button>
            {project.homepage && (
              <Button
                href={project.homepage}
                aria-label={`Live site for ${project.title}`}
                variant="ghost"
                size="sm"
                target="_blank"
                rel="noopener noreferrer"
                leftIcon={<Link size={15} aria-hidden />}
              >
                <span className={layoutStyles.heroLabel}>Live</span>
              </Button>
            )}
          </div>
          <div className={layoutStyles.heroLinks}>
            {link("", "Code", <CodeXml size={15} aria-hidden />)}
            {link(
              "/issues",
              "Issues",
              <CircleDot size={15} aria-hidden />,
              layoutStyles.heroIssues,
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function ShowcaseActions({
  project,
  onQuickView,
}: {
  project: MergedProject;
  onQuickView: MouseEventHandler<HTMLButtonElement>;
}) {
  const repoUrl = (project.htmlUrl ?? `https://github.com/${GITHUB_OWNER}/${project.repo}`).replace(
    /\/+$/,
    "",
  );
  const link = (href: string, label: string, aria: string, icon: ReactNode) => (
    <Button
      href={href}
      aria-label={`${aria} for ${project.title}`}
      variant="ghost"
      size="sm"
      target="_blank"
      rel="noopener noreferrer"
      leftIcon={icon}
    >
      {label}
    </Button>
  );
  return (
    <div className={layoutStyles.showcaseActions}>
      <div>
        <Button
          size="sm"
          onClick={onQuickView}
          aria-label={`View ${project.title}`}
          leftIcon={<Eye size={13} aria-hidden />}
        >
          View
        </Button>
        {project.homepage &&
          link(project.homepage, "Live", "Live site", <Link size={15} aria-hidden />)}
      </div>
      <div>
        {link(repoUrl, "Code", "Code", <CodeXml size={15} aria-hidden />)}
        {link(`${repoUrl}/issues`, "Issues", "Issues", <CircleDot size={15} aria-hidden />)}
      </div>
    </div>
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
    }, 5000);
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
              <article className={`${CARD} ${layoutStyles.showcaseCard}`}>
                <Frame
                  title={project.title}
                  onQuickView={(event) => onQuickView(project, event)}
                  className={layoutStyles.showcaseMedia}
                >
                  <Cover
                    project={project}
                    sizes="60vw"
                    loading={index === 0 ? "eager" : "lazy"}
                    intrinsic
                  />
                </Frame>
                <div className={layoutStyles.showcaseCopy}>
                  <RepoHeader repo={project.repo} />
                  <div
                    className={layoutStyles.showcaseText}
                    data-awaiting-rise={
                      !reducedMotion && index !== (settledSlide ?? 0) ? "" : undefined
                    }
                    data-rise={!reducedMotion && settledSlide === index ? "" : undefined}
                  >
                    <div className={layoutStyles.repoTitle}>
                      <h3>{project.title}</h3>
                      {project.category && (
                        <span className={layoutStyles.repoBadge} data-category={project.category}>
                          {project.category}
                        </span>
                      )}
                    </div>
                    {description && (
                      <p className={layoutStyles.showcaseDescription}>{description}</p>
                    )}
                  </div>
                  <ShowcaseActions
                    project={project}
                    onQuickView={(event) => onQuickView(project, event)}
                  />
                </div>
              </article>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const GITHUB_AVATAR = "https://avatars.githubusercontent.com/u/29801489?v=4";
const relativeTime = new Intl.RelativeTimeFormat("en", { numeric: "always" });
const subscribeToUpdatedLabel = () => () => {};

function RecentUpdate({ date }: { date: Date }) {
  const label = useSyncExternalStore(
    subscribeToUpdatedLabel,
    () => {
      const days = Math.floor(Math.max(0, Date.now() - date.getTime()) / 86_400_000);
      if (days >= 365) return relativeTime.format(-Math.floor(days / 365), "year");
      if (days >= 30) return relativeTime.format(-Math.floor(days / 30), "month");
      if (days >= 7) return relativeTime.format(-Math.floor(days / 7), "week");
      return days ? relativeTime.format(-days, "day") : "today";
    },
    () => pushedLabel(date),
  );
  return <time dateTime={date.toISOString()}>Updated {label}</time>;
}

export function RepoHeader({ repo, pullsUrl }: { repo: string; pullsUrl?: string }) {
  return (
    <div className={layoutStyles.repoHeader}>
      <span className={layoutStyles.repoGlyph} aria-hidden>
        <Menu size={14} />
      </span>
      <Github size={18} aria-hidden />
      <div className={layoutStyles.repoPath} title={`${GITHUB_OWNER}/${repo}`}>
        <span>{GITHUB_OWNER}</span>
        <span aria-hidden>/</span>
        <strong>{repo}</strong>
      </div>
      {pullsUrl ? (
        <a
          className={`${layoutStyles.repoGlyph} hover:text-foreground focus-visible:outline-ring focus-visible:outline-2`}
          href={pullsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Pull requests for ${repo} on GitHub`}
        >
          <GitPullRequest size={14} aria-hidden />
        </a>
      ) : (
        <span className={layoutStyles.repoGlyph} aria-hidden>
          <GitPullRequest size={14} />
        </span>
      )}
      <span className={layoutStyles.repoGlyph} aria-hidden>
        <Inbox size={14} />
      </span>
      <Image src={GITHUB_AVATAR} alt="" width={22} height={22} className="rounded-full" />
    </div>
  );
}

export function RecentCard({
  project,
  onQuickView,
}: {
  project: MergedProject;
  onQuickView: MouseEventHandler<HTMLButtonElement>;
}) {
  const category = project.category;
  const repoUrl = (project.htmlUrl ?? `https://github.com/${GITHUB_OWNER}/${project.repo}`).replace(
    /\/+$/,
    "",
  );
  return (
    <article className={`${layoutStyles.recentCard} ${CARD}`}>
      <button
        type="button"
        className={`${FRAME} ${layoutStyles.recentMedia}`}
        aria-label={`View ${project.title}`}
        onClick={onQuickView}
      >
        <Cover project={project} sizes="(min-width: 1200px) 206px, 176px" intrinsic />
        <PosterEye />
      </button>
      <RepoHeader repo={project.repo} pullsUrl={`${repoUrl}/pulls`} />
      <div className={layoutStyles.repoSummary}>
        <div className={layoutStyles.repoTitle}>
          <h3 title={project.title}>{project.title}</h3>
          {category && (
            <span
              className={layoutStyles.repoBadge}
              data-category={project.category}
              title={category}
            >
              {category === "Automation & Tools" ? (
                <>
                  Automation<span className={layoutStyles.repoBadgeSuffix}> &amp; Tools</span>
                </>
              ) : (
                category
              )}
            </span>
          )}
        </div>
        {project.pushedAt && (
          <p className={layoutStyles.repoMeta}>
            <RecentUpdate date={project.pushedAt} />
          </p>
        )}
      </div>
      <div className={layoutStyles.repoActions}>
        <Button
          className={layoutStyles.repoDesktopView}
          size="sm"
          leftIcon={<Eye size={13} aria-hidden />}
          aria-label={`Open project details for ${project.title}`}
          onClick={onQuickView}
        >
          View
        </Button>
        {project.homepage && (
          <Button
            className={layoutStyles.repoLive}
            href={project.homepage}
            aria-label={`Live site for ${project.title}`}
            variant="ghost"
            size="sm"
            target="_blank"
            rel="noopener noreferrer"
            leftIcon={<Link size={15} aria-hidden />}
          >
            <span className={layoutStyles.repoActionLabel}>Live</span>
          </Button>
        )}
        <Button
          href={repoUrl}
          aria-label={`Code for ${project.title}`}
          variant="ghost"
          size="sm"
          target="_blank"
          rel="noopener noreferrer"
          leftIcon={<CodeXml size={15} aria-hidden />}
        >
          <span className={layoutStyles.repoActionLabel}>Code</span>
        </Button>
        <Button
          className={layoutStyles.repoIssues}
          href={`${repoUrl}/issues`}
          aria-label={`Issues for ${project.title}`}
          variant="ghost"
          size="sm"
          target="_blank"
          rel="noopener noreferrer"
          leftIcon={<CircleDot size={15} aria-hidden />}
        >
          <span className={layoutStyles.repoActionLabel}>Issues</span>
        </Button>
      </div>
    </article>
  );
}
