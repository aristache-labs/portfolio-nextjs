"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Image from "next/image";
import { ProjectRepoBadges } from "./ProjectRepoBadges";
import { ChevronLeft, ChevronRight, Star, GitFork, ExternalLink, Github } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import type { MergedProject } from "@/lib/projects";
import { pluralize } from "@/utils/plural";
import styles from "./project-quick-view.module.css";

type Slide = { src: string; poster: boolean };

/** Tallest the poster well may grow. A 9:16 shot uses this height; a 16:9 shot is shorter. */
const STAGE_MAX = "min(50vh, 26rem)";

// Match the dialog's portrait width, landscape image column and desktop max-w-2xl.
// These are CSS widths, without a manual pixel-density multiplier.
const PREVIEW_SIZES = [
  "(orientation: portrait) and (max-width: 1023px) min(calc(100vw - 48px), 42rem)",
  "(orientation: landscape) and (max-width: 1023px) and (max-height: 600px) min(calc((100vw - 72px) * 0.42), 352.8px)",
  "min(calc(100vw - 2rem), 42rem)",
].join(", ");

function slidesFor(project: MergedProject): Slide[] {
  return [
    ...(project.coverImage ? [{ src: project.coverImage, poster: true }] : []),
    ...project.screenshots.map((src) => ({ src, poster: false })),
  ];
}

function PosterCarousel({
  title,
  slides,
  index,
  ratio,
  onIndex,
}: {
  title: string;
  slides: Slide[];
  index: number;
  ratio: number | undefined;
  onIndex: (next: number) => void;
}) {
  if (slides.length === 0) {
    return (
      <div className="border-border relative aspect-16/9 w-full shrink-0 overflow-hidden rounded-t-2xl border-b">
        <div className="size-full bg-(image:--gradient-brand) opacity-80" />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/45 to-transparent"
        />
      </div>
    );
  }

  const slide = slides[index] ?? slides[0];
  const portrait = ratio != null && ratio < 1;
  const many = slides.length > 1;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={`${title} images`}
      className="border-border relative w-full shrink-0 overflow-hidden rounded-t-2xl border-b bg-black/55"
      style={
        portrait
          ? { height: STAGE_MAX }
          : { aspectRatio: ratio && ratio > 0 ? String(ratio) : "16 / 9", maxHeight: STAGE_MAX }
      }
    >
      <Image
        key={slide.src}
        src={slide.src}
        alt={slide.poster ? `${title} poster` : `${title} screenshot ${index}`}
        fill
        sizes={index === 0 ? PREVIEW_SIZES : `auto, ${PREVIEW_SIZES}`}
        loading={index === 0 ? undefined : "lazy"}
        quality={90}
        className="object-contain"
        priority={index === 0}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/45 to-transparent"
      />
      {many && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => onIndex((index - 1 + slides.length) % slides.length)}
            className="absolute top-1/2 left-3 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/80 text-white ring-1 ring-white/50 transition-colors hover:bg-black"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={() => onIndex((index + 1) % slides.length)}
            className="absolute top-1/2 right-3 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/80 text-white ring-1 ring-white/50 transition-colors hover:bg-black"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
          <p className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/75 px-2.5 py-1 font-mono text-[11px] tracking-wider text-white">
            {slide.poster ? "Poster" : "Screenshot"} {index + 1} / {slides.length}
          </p>
        </>
      )}
    </div>
  );
}

/**
 * ProjectsBrowser renders ONE instance and points it at whichever card opened, rather than a
 * Dialog per card - 20 projects would otherwise mount 20 portals, focus traps and scroll locks.
 */
export function ProjectQuickView({
  project,
  onClose,
  onRestoreFocus,
}: {
  project: MergedProject | null;
  onClose: () => void;
  onRestoreFocus?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [descriptionElement, setDescriptionElement] = useState<HTMLSpanElement | null>(null);
  const [previousProjectId, setPreviousProjectId] = useState(project?.id ?? null);
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const projectId = project?.id ?? null;
  useEffect(() => {
    const span = descriptionElement;
    const paragraph = span?.parentElement;
    const container = paragraph?.parentElement;
    if (!span || !paragraph || !container) return;
    const text = project?.description?.trim() || "Read the project documentation on GitHub.";
    const fit = () => {
      span.replaceChildren(document.createTextNode(text));
      const available = Math.max(0, container.clientHeight - 2);
      if (!available || paragraph.scrollHeight <= available) return;
      const words = text.split(/\s+/);
      let low = 0;
      let high = words.length;
      while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        span.replaceChildren(document.createTextNode(`${words.slice(0, middle).join(" ")}…`));
        if (paragraph.scrollHeight <= available) low = middle;
        else high = middle - 1;
      }
      span.replaceChildren(document.createTextNode(`${words.slice(0, low).join(" ")}…`));
    };
    const observer = new ResizeObserver(fit);
    observer.observe(container);
    fit();
    return () => observer.disconnect();
  }, [project, descriptionElement]);
  if (projectId !== previousProjectId) {
    setPreviousProjectId(projectId);
    setIndex(0);
  }
  const sourceKey = project
    ? [project.coverImage, ...project.screenshots].filter(Boolean).join("\n")
    : "";
  const slideCount = project ? (project.coverImage ? 1 : 0) + project.screenshots.length : 0;

  useEffect(() => {
    if (!sourceKey) return;
    let cancelled = false;
    for (const src of sourceKey.split("\n")) {
      const img = new window.Image();
      img.onload = () => {
        if (cancelled || !img.naturalWidth || !img.naturalHeight) return;
        const ratio = img.naturalWidth / img.naturalHeight;
        setRatios((prev) => (prev[src] === ratio ? prev : { ...prev, [src]: ratio }));
      };
      img.src = src;
    }
    return () => {
      cancelled = true;
    };
  }, [sourceKey]);

  useEffect(() => {
    if (slideCount < 2) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const delta = event.key === "ArrowRight" ? 1 : -1;
      setIndex((current) => (current + delta + slideCount) % slideCount);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slideCount]);

  const open = project !== null;
  if (!project) return null;

  const slides = slidesFor(project);
  const safeIndex = slides.length === 0 ? 0 : Math.min(index, slides.length - 1);
  const activeRatio = slides[safeIndex] ? ratios[slides[safeIndex].src] : undefined;

  const githubUrl = project.htmlUrl ?? `https://github.com/aristache-labs/${project.repo}`;
  const blurb = project.description ?? "";
  const excerpt = blurb.trim() || null;
  const tags =
    project.language || project.tags.length > 0 ? (
      <div className="flex flex-wrap items-center justify-end gap-1.5">
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
    ) : null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        onCloseAutoFocus={(event) => {
          if (!onRestoreFocus) return;
          event.preventDefault();
          onRestoreFocus();
        }}
        className={`max-w-2xl ${styles.dialog}`}
        style={{ "--preview-ratio": activeRatio ?? 16 / 9 } as CSSProperties}
      >
        <PosterCarousel
          title={project.title}
          slides={slides}
          index={safeIndex}
          ratio={activeRatio}
          onIndex={setIndex}
        />

        <DialogHeader className={styles.header}>
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className={`min-w-0 lg:text-[22px] ${styles.title}`}>
              {project.title}
            </DialogTitle>
            <div className={`hidden max-w-[55%] self-center lg:block ${styles.titleTags}`}>
              {tags}
            </div>
            <div
              className={`text-muted flex shrink-0 items-center gap-3 text-sm lg:hidden ${styles.mobileOnlyHidden}`}
            >
              {(project.stars ?? 0) > 0 && (
                <span
                  className="flex items-center gap-1"
                  aria-label={pluralize(project.stars ?? 0, "star")}
                >
                  <Star className="size-4" aria-hidden /> {project.stars ?? "—"}
                </span>
              )}
              {(project.forks ?? 0) > 0 && (
                <span
                  className="flex items-center gap-1"
                  aria-label={pluralize(project.forks ?? 0, "fork")}
                >
                  <GitFork className="size-4" aria-hidden /> {project.forks ?? "—"}
                </span>
              )}
            </div>
          </div>
          {blurb && (
            <DialogDescription className={`line-clamp-3 lg:sr-only ${styles.mobileOnlyHidden}`}>
              {blurb}
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogBody className={`space-y-5 ${styles.body}`}>
          <div>
            <p className="text-muted text-sm leading-relaxed lg:text-[15px]">
              <span ref={setDescriptionElement} className={styles.descriptionText}>
                {excerpt || "Read the project documentation on GitHub."}
              </span>{" "}
              <a
                href={`${githubUrl.replace(/\/$/, "")}#readme`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-bright focus-visible:ring-brand-mid/70 inline rounded-sm text-xs font-medium whitespace-nowrap hover:underline focus-visible:ring-2 focus-visible:outline-none"
              >
                View more <ExternalLink className="inline size-2.5 align-baseline" aria-hidden />
              </a>
            </p>
          </div>
          <div className={`lg:hidden ${styles.mobileOnlyHidden}`}>{tags}</div>
        </DialogBody>

        <DialogFooter
          className={`flex-row flex-wrap items-center justify-start gap-2 sm:justify-start ${styles.footer}`}
        >
          {project.homepage && (
            <Button
              href={project.homepage}
              aria-label={`Live site for ${project.title}`}
              className="min-h-11 min-w-11"
              size="sm"
              target="_blank"
              rel="noopener noreferrer"
              leftIcon={<ExternalLink className="size-3.5" aria-hidden />}
            >
              <span className={styles.mobileOnlyHidden}>Live site</span>
              <span
                className={`hidden [@media(max-width:1023px)_and_(orientation:portrait)]:inline ${styles.shortLabel}`}
              >
                Live
              </span>
            </Button>
          )}
          <Button
            href={githubUrl}
            aria-label={`Code for ${project.title}`}
            className="min-h-11 min-w-11"
            variant="secondary"
            size="sm"
            target="_blank"
            rel="noopener noreferrer"
            leftIcon={<Github className="size-3.5" aria-hidden />}
          >
            <span className={styles.mobileOnlyHidden}>View code</span>
            <span
              className={`hidden [@media(max-width:1023px)_and_(orientation:portrait)]:inline ${styles.shortLabel}`}
            >
              Code
            </span>
          </Button>
          <div className="ml-auto">
            <ProjectRepoBadges repo={project.repo} />
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
