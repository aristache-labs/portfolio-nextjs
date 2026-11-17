"use client";

import { useEffect, type RefObject } from "react";
import { useScroll } from "framer-motion";
import { phaseProgress, smoothstep } from "@/lib/scroll-phase";
import { PINNED_SCENE_QUERY, LANDSCAPE_LAYOUT_QUERY } from "@/hooks/useMediaQuery";
import styles from "./hero-motion.module.css";

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

const HANDOFF_RANGE = {
  desktop: { start: 0.1, end: 0.9 },
  touch: { start: 0.22, end: 0.9 },
} as const;

const CTA_RETURN_COLLAPSE_PX = 48;
/** Matches the hero's `scroll-mt-24`: a CTA above this line sits under the fixed header. */
const HEADER_CLEARANCE_PX = 96;

/**
 * Each variable is written only on the elements whose rules read it. A custom property set on the
 * section itself invalidated style for the whole scene (plate, canvas, buttons) on every scroll
 * frame, which was most of the recalculation cost while scrolling the hero.
 */
const VARIABLE_TARGETS: Record<string, (keyof typeof styles)[]> = {
  "media-y": ["scrollMedia"],
  "media-scale": ["scrollMedia"],
  "copy-y": ["scrollCopy"],
  "copy-opacity": ["scrollCopy"],
  "light-progress": ["halo", "scrollCue"],
  handoff: ["handoff"],
  "exit-actions": ["exitActions", "sceneControl"],
  "exit-details": ["exitDetails"],
  "exit-specialization": ["specialization", "availability"],
  "exit-title": ["exitTitle"],
};

const SELECTORS = Object.fromEntries(
  Object.entries(VARIABLE_TARGETS).map(([name, keys]) => [
    name,
    keys.map((key) => `.${styles[key]}`).join(","),
  ]),
);

/**
 * `null` removes the variable. Queried each time, since the video control mounts later.
 * An unchanged value is skipped: most variables sit at 0 or 1 for long stretches of the scroll,
 * and every write restyles the target's subtree even when the value is the same.
 */
function writeVariable(node: HTMLElement, name: string, value: string | null) {
  const property = `--hero-${name}`;
  for (const target of node.querySelectorAll<HTMLElement>(SELECTORS[name])) {
    if (target.style.getPropertyValue(property) === (value ?? "")) continue;
    if (value === null) target.style.removeProperty(property);
    else target.style.setProperty(property, value);
  }
}

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
    const start = variant === "touch" ? 0 : pinned ? 0.08 : 0.15;
    const cta = node.querySelector(`.${styles.actions}`);
    // Unpinned, the CTA scrolls away with the page; its annotations stop once it reaches the header.
    const ctaClear = () => !cta || cta.getBoundingClientRect().top > HEADER_CLEARANCE_PX;
    let previous = scrollYProgress.get();
    const update = (value: number) => {
      const progress = Math.max(0, Math.min(1, value));
      const scrolling = progress !== previous;
      const returning = progress < previous;
      previous = progress;
      node.toggleAttribute(
        "data-cta-expanding",
        scrolling &&
          progress > 0 &&
          (returning
            ? window.scrollY > CTA_RETURN_COLLAPSE_PX
            : progress >= start &&
              (pinned ? progress < phases[0].end : progress < 0.8 && ctaClear())),
      );
      writeVariable(node, "light-progress", pinned ? String(progress) : null);
      if (pinned) {
        for (const phase of phases) {
          const value = smoothstep(phaseProgress(progress, phase.start, phase.end));
          writeVariable(node, `exit-${phase.name}`, String(value));
        }
      }
      if (variant) {
        const range = HANDOFF_RANGE[variant];
        const value = smoothstep(phaseProgress(progress, range.start, range.end));
        writeVariable(node, "handoff", String(value));
      } else writeVariable(node, "handoff", null);
      writeVariable(node, "media-y", `${progress * (pinned ? -2 : expressive ? 18 : 5)}%`);
      writeVariable(
        node,
        "media-scale",
        String(1 + progress * (pinned ? 0.1 : expressive ? 0.06 : 0.02)),
      );
      writeVariable(node, "copy-y", `${progress * (pinned ? 0 : expressive ? -40 : -12)}px`);
      // Touch keeps the copy legible throughout its natural passage out of view.
      const fade = expressive && !pinned ? Math.max(0, Math.min(1, (progress - 0.45) / 0.4)) : 0;
      writeVariable(node, "copy-opacity", String(1 - fade));
    };
    update(scrollYProgress.get());
    const unsubscribe = scrollYProgress.on("change", update);
    return () => {
      unsubscribe();
      node.removeAttribute("data-cta-expanding");
      for (const name of Object.keys(VARIABLE_TARGETS)) writeVariable(node, name, null);
    };
  }, [expressive, pinned, scrollYProgress, section, variant]);

  return null;
}
