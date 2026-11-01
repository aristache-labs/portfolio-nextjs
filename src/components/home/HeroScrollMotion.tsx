"use client";

import { useEffect, type RefObject } from "react";
import { useScroll } from "framer-motion";

export const HERO_PIN_QUERY =
  "(min-width: 1024px) and (min-height: 700px) and (pointer: fine) and (hover: hover)";

/** Touch phones and small tablets in landscape get a shorter version of the pinned scene. */
export const HERO_LANDSCAPE_PIN_QUERY = "(orientation: landscape) and (pointer: coarse)";

const EXIT_PHASES = [
  { name: "specialization", start: 0.18, end: 0.65 },
  { name: "title", start: 0.32, end: 0.85 },
  { name: "details", start: 0.4, end: 0.94 },
  { name: "actions", start: 0.55, end: 1 },
] as const;

/** Only mounted after motion preferences resolve; native scrolling stays in control. */
export function HeroScrollMotion({
  section,
  expressive,
  pinned = false,
}: {
  section: RefObject<HTMLElement | null>;
  expressive: boolean;
  pinned?: boolean;
}) {
  const { scrollYProgress } = useScroll({
    target: section,
    offset: ["start start", pinned ? "end end" : "end start"],
  });

  useEffect(() => {
    const node = section.current;
    if (!node) return;
    const update = (value: number) => {
      const progress = Math.max(0, Math.min(1, value));
      if (pinned) node.style.setProperty("--hero-light-progress", String(progress));
      else node.style.removeProperty("--hero-light-progress");
      for (const phase of EXIT_PHASES) {
        const property = `--hero-exit-${phase.name}`;
        if (pinned) {
          const value = Math.max(
            0,
            Math.min(1, (progress - phase.start) / (phase.end - phase.start)),
          );
          node.style.setProperty(property, String(value * value * (3 - 2 * value)));
        } else node.style.removeProperty(property);
      }
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
      for (const name of ["media-y", "media-scale", "copy-y", "copy-opacity", "light-progress"]) {
        node.style.removeProperty(`--hero-${name}`);
      }
      for (const phase of EXIT_PHASES) node.style.removeProperty(`--hero-exit-${phase.name}`);
    };
  }, [expressive, pinned, scrollYProgress, section]);

  return null;
}
