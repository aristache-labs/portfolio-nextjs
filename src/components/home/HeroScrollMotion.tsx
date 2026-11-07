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
  { name: "actions", start: 0.12, end: 0.5 },
  { name: "details", start: 0.22, end: 0.62 },
  { name: "specialization", start: 0.32, end: 0.78 },
  { name: "title", start: 0.55, end: 1 },
] as const;

/** Shorter pins than desktop, so the lower layers clear sooner while the name still overlaps About. */
const TOUCH_EXIT_PHASES = [
  { name: "actions", start: 0.08, end: 0.4 },
  { name: "details", start: 0.18, end: 0.52 },
  { name: "specialization", start: 0.3, end: 0.7 },
  { name: "title", start: 0.58, end: 1 },
] as const;

const HANDOFF_RANGE = {
  desktop: { start: 0.1, end: 0.9 },
  touch: { start: 0.22, end: 0.9 },
} as const;

const PHASE_NAMES = TOUCH_EXIT_PHASES.map((phase) => phase.name);

export type HeroScrollVariant = "desktop" | "touch";

/** Only mounted after motion preferences resolve; native scrolling stays in control. */
export function HeroScrollMotion({
  section,
  expressive,
  variant,
}: {
  section: RefObject<HTMLElement | null>;
  expressive: boolean;
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
    const phases = variant === "desktop" ? DESKTOP_EXIT_PHASES : TOUCH_EXIT_PHASES;
    const update = (value: number) => {
      const progress = Math.max(0, Math.min(1, value));
      if (pinned) node.style.setProperty("--hero-light-progress", String(progress));
      else node.style.removeProperty("--hero-light-progress");
      for (const phase of phases) {
        const property = `--hero-exit-${phase.name}`;
        if (pinned)
          node.style.setProperty(
            property,
            String(smoothstep(phaseProgress(progress, phase.start, phase.end))),
          );
        else node.style.removeProperty(property);
      }
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
      for (const name of PHASE_NAMES) node.style.removeProperty(`--hero-exit-${name}`);
    };
  }, [expressive, pinned, scrollYProgress, section, variant]);

  return null;
}
