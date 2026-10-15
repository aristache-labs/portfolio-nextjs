"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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

type Slide = { src: string; poster: boolean };

/** Tallest the poster well may grow. A 9:16 shot uses this height; a 16:9 shot is shorter. */
const STAGE_MAX = "min(50vh, 26rem)";

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
        sizes="(max-width: 640px) 100vw, 42rem"
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
}: {
  project: MergedProject | null;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const projectId = project?.id ?? null;
  const sourceKey = project
    ? [project.coverImage, ...project.screenshots].filter(Boolean).join("\n")
    : "";
  const slideCount = project ? (project.coverImage ? 1 : 0) + project.screenshots.length : 0;

  useEffect(() => {
    setIndex(0);
  }, [projectId]);

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
  // The excerpt only earns its space when it says something the blurb did not.
  const excerpt =
    project.readmeExcerpt && !blurb.startsWith(project.readmeExcerpt.slice(0, 40))
      ? project.readmeExcerpt
      : null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-2xl">
        <PosterCarousel
          title={project.title}
          slides={slides}
          index={safeIndex}
          ratio={activeRatio}
          onIndex={setIndex}
        />

        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <DialogTitle>{project.title}</DialogTitle>
            <div className="text-muted flex shrink-0 items-center gap-3 text-sm">
              <span
                className="flex items-center gap-1"
                aria-label={pluralize(project.stars ?? 0, "star")}
              >
                <Star className="size-4" aria-hidden /> {project.stars ?? "—"}
              </span>
              <span
                className="flex items-center gap-1"
                aria-label={pluralize(project.forks ?? 0, "fork")}
              >
                <GitFork className="size-4" aria-hidden /> {project.forks ?? "—"}
              </span>
            </div>
          </div>
          {blurb && <DialogDescription className="line-clamp-3">{blurb}</DialogDescription>}
        </DialogHeader>

        <DialogBody className="space-y-5">
          {excerpt && (
            <div>
              <h4 className="text-muted mb-1.5 text-xs font-semibold tracking-wider uppercase">
                From the README
              </h4>
              <p className="text-muted line-clamp-4 text-sm leading-relaxed text-pretty">
                {excerpt}
              </p>
            </div>
          )}

          {(project.language || project.tags.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {project.language && (
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
        </DialogBody>

        <DialogFooter className="gap-2">
          <Button
            href={githubUrl}
            variant="secondary"
            size="sm"
            target="_blank"
            rel="noopener noreferrer"
            leftIcon={<Github className="size-3.5" aria-hidden />}
          >
            View code
          </Button>
          {project.homepage && (
            <Button
              href={project.homepage}
              size="sm"
              target="_blank"
              rel="noopener noreferrer"
              leftIcon={<ExternalLink className="size-3.5" aria-hidden />}
            >
              Live site
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
