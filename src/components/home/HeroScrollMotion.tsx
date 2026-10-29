"use client";

import { useEffect, type RefObject } from "react";
import { useScroll } from "framer-motion";

export const HERO_PIN_QUERY =
  "(min-width: 1024px) and (min-height: 700px) and (pointer: fine) and (hover: hover)";

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
      node.style.setProperty(
        "--hero-media-y",
        `${progress * (pinned ? -2 : expressive ? 18 : 5)}%`,
      );
      node.style.setProperty(
        "--hero-media-scale",
        String(1 + progress * (pinned ? 0.08 : expressive ? 0.06 : 0.02)),
      );
      node.style.setProperty("--hero-copy-y", `${progress * (expressive ? -40 : -12)}px`);
      // Touch keeps the copy legible throughout its natural passage out of view.
      const fade = expressive
        ? Math.max(0, Math.min(1, (progress - (pinned ? 0.15 : 0.45)) / (pinned ? 0.7 : 0.4)))
        : 0;
      node.style.setProperty("--hero-copy-opacity", String(1 - fade));
    };
    update(scrollYProgress.get());
    const unsubscribe = scrollYProgress.on("change", update);
    return () => {
      unsubscribe();
      for (const name of ["media-y", "media-scale", "copy-y", "copy-opacity"]) {
        node.style.removeProperty(`--hero-${name}`);
      }
    };
  }, [expressive, pinned, scrollYProgress, section]);

  return null;
}
