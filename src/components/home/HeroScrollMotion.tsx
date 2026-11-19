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
  { name: "actions", start: 0.34, end: 0.66 },
  { name: "details", start: 0.36, end: 0.7 },
  { name: "specialization", start: 0.42, end: 0.82 },
  { name: "title", start: 0.6, end: 1 },
] as const;

/** Touch keeps actions readable longer during the shorter handoff. */
const TOUCH_EXIT_PHASES = [
  { name: "actions", start: 0.46, end: 0.86 },
  { name: "details", start: 0.49, end: 0.87 },
  { name: "specialization", start: 0.52, end: 0.9 },
  { name: "title", start: 0.64, end: 1 },
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
 * section itself invalidates styles for the whole scene on every scroll frame.
 */
const VARIABLE_TARGETS: Record<string, (keyof typeof styles)[]> = {
  "media-y": ["scrollMedia"],
  "media-scale": ["scrollMedia"],
  "light-progress": ["scrollCue"],
  handoff: ["handoff"],
  "exit-actions": ["exitActions", "sceneControl"],
  "exit-details": ["exitDetails"],
  "exit-specialization": ["specialization"],
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
  expandProjects = true,
  variant,
}: {
  section: RefObject<HTMLElement | null>;
  expressive: boolean;
  expandProjects?: boolean;
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
    const travel = expressive ? -1.5 : -0.5;
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
        expandProjects &&
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
      writeVariable(node, "media-y", String(progress * travel) + "%");
      writeVariable(node, "media-scale", String(1 + progress * (expressive ? 0.04 : 0.02)));
    };
    update(scrollYProgress.get());
    const unsubscribe = scrollYProgress.on("change", update);
    return () => {
      unsubscribe();
      node.removeAttribute("data-cta-expanding");
      for (const name of Object.keys(VARIABLE_TARGETS)) writeVariable(node, name, null);
    };
  }, [expandProjects, expressive, pinned, scrollYProgress, section, variant]);

  return null;
}
