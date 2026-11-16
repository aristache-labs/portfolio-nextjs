"use client";

import { useEffect, type RefObject } from "react";
import { useScroll } from "framer-motion";
import { phaseProgress, smoothstep } from "@/lib/scroll-phase";
import { PINNED_SCENE_QUERY, LANDSCAPE_LAYOUT_QUERY } from "@/hooks/useMediaQuery";

export const HERO_PIN_QUERY = PINNED_SCENE_QUERY;

/** Touch phones and small tablets in landscape get a shorter version of the pinned scene. */
export const HERO_LANDSCAPE_PIN_QUERY = LANDSCAPE_LAYOUT_QUERY;

/** About rises from the bottom on desktop, so layers leave in the order it covers them. */
const DESKTOP_EXIT_PHASES = [
  { name: "actions", start: 0.22, end: 0.58 },
  { name: "details", start: 0.22, end: 0.62 },
  { name: "specialization", start: 0.32, end: 0.78 },
  { name: "title", start: 0.55, end: 1 },
] as const;

/** Shorter pins than desktop, so the lower layers clear sooner while the name still overlaps About. */
const TOUCH_EXIT_PHASES = [
  { name: "actions", start: 0.18, end: 0.48 },
  { name: "details", start: 0.18, end: 0.52 },
  { name: "specialization", start: 0.3, end: 0.7 },
  { name: "title", start: 0.58, end: 1 },
] as const;

const PORTRAIT_EXIT_PHASES = [
  { name: "actions", start: 0.38, end: 0.63 },
  { name: "cue", start: 0.08, end: 0.27 },
  { name: "socials", start: 0.25, end: 0.46 },
  { name: "details", start: 0.51, end: 0.76 },
  { name: "specialization", start: 0.65, end: 0.9 },
  { name: "title", start: 0.75, end: 1 },
] as const;

const HANDOFF_RANGE = {
  desktop: { start: 0.1, end: 0.9 },
  touch: { start: 0.22, end: 0.9 },
} as const;

const CTA_RETURN_COLLAPSE_PX = 48;

function updateExitPhases(
  node: HTMLElement,
  progress: number,
  phases: readonly { name: string; start: number; end: number }[],
) {
  for (const phase of phases) {
    node.style.setProperty(
      `--hero-exit-${phase.name}`,
      String(smoothstep(phaseProgress(progress, phase.start, phase.end))),
    );
  }
}

export type HeroScrollVariant = "desktop" | "touch";

/** Only mounted after motion preferences resolve; native scrolling stays in control. */
export function HeroScrollMotion({
  section,
  expressive,
  portraitHandoff,
  variant,
}: {
  section: RefObject<HTMLElement | null>;
  expressive: boolean;
  portraitHandoff?: boolean;
  /** Which pinned scene is active; omitted when the hero scrolls away unpinned. */
  variant?: HeroScrollVariant;
}) {
  const pinned = variant !== undefined;
  const { scrollYProgress } = useScroll({
    target: section,
    offset: ["start start", pinned ? "end end" : "end start"],
  });

  useEffect(() => {
    const node = section.current;
    if (!node) return;
    const next = node.nextElementSibling;
    const about =
      portraitHandoff && next instanceof HTMLElement && next.id === "about" ? next : null;
    const phases = portraitHandoff
      ? PORTRAIT_EXIT_PHASES
      : variant === "desktop"
        ? DESKTOP_EXIT_PHASES
        : TOUCH_EXIT_PHASES;
    const start = variant === "touch" ? 0 : pinned ? 0.08 : 0.15;
    let previous = scrollYProgress.get();
    const update = (value: number) => {
      const progress = Math.max(0, Math.min(1, value));
      about?.style.setProperty(
        "--about-fog-opacity",
        String(1 - smoothstep(phaseProgress(progress, 0.3, 0.92))),
      );
      const scrolling = progress !== previous;
      const returning = progress < previous;
      previous = progress;
      node.toggleAttribute(
        "data-cta-expanding",
        progress > 0 &&
          (portraitHandoff ||
            (scrolling &&
              (returning
                ? window.scrollY > CTA_RETURN_COLLAPSE_PX
                : progress >= start && progress < (pinned ? phases[0].end : 0.8)))),
      );
      if (pinned) node.style.setProperty("--hero-light-progress", String(progress));
      else node.style.removeProperty("--hero-light-progress");
      if (pinned) updateExitPhases(node, progress, phases);
      if (variant) {
        const range = HANDOFF_RANGE[variant];
        node.style.setProperty(
          "--hero-handoff",
          String(smoothstep(phaseProgress(progress, range.start, range.end))),
        );
      } else node.style.removeProperty("--hero-handoff");
      node.style.setProperty(
        "--hero-media-y",
        `${progress * (pinned ? -2 : expressive ? 18 : 5)}%`,
      );
      node.style.setProperty(
        "--hero-media-scale",
        String(1 + progress * (pinned ? 0.1 : expressive ? 0.06 : 0.02)),
      );
      node.style.setProperty(
        "--hero-copy-y",
        `${progress * (pinned ? 0 : expressive ? -40 : -12)}px`,
      );
      // Touch keeps the copy legible throughout its natural passage out of view.
      const fade = expressive && !pinned ? Math.max(0, Math.min(1, (progress - 0.45) / 0.4)) : 0;
      node.style.setProperty("--hero-copy-opacity", String(1 - fade));
    };
    update(scrollYProgress.get());
    const unsubscribe = scrollYProgress.on("change", update);
    return () => {
      unsubscribe();
      about?.style.removeProperty("--about-fog-opacity");
      node.removeAttribute("data-cta-expanding");
      for (const name of [
        "media-y",
        "media-scale",
        "copy-y",
        "copy-opacity",
        "light-progress",
        "handoff",
      ]) {
        node.style.removeProperty(`--hero-${name}`);
      }
      for (const { name } of phases) node.style.removeProperty(`--hero-exit-${name}`);
    };
  }, [expressive, portraitHandoff, pinned, scrollYProgress, section, variant]);

  return null;
}
