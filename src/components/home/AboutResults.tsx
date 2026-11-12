"use client";

import type { ReactNode } from "react";
import { ProgressiveReveal } from "@/components/motion/ProgressiveReveal";
import { FOLD_VIEWPORT_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import { ABOUT_FOLD_QUERY } from "./AboutSequence";

/** A short Fold seats the results row near the bottom edge, so it must trigger from there. */
const SHORT_FOLD_QUERY = `${FOLD_VIEWPORT_QUERY} and (max-height: 780px)`;
const SHORT_FOLD_INSET = 16;
/**
 * The results row rests low on screen in About's pinned scene, at about 85% of the height. The
 * general wait for timed entrances (a third of the screen) would never be met there, so the row
 * keeps a small, fixed wait of its own.
 */
const RESTING_INSET = 120;

/** Enter at the end of About, then start the counters after the panel settles. */
export function AboutResults({ children, className }: { children: ReactNode; className: string }) {
  const opaque = useMediaQuery(
    `(min-width: 1024px) and (pointer: fine), (orientation: landscape) and (pointer: coarse), ${ABOUT_FOLD_QUERY}`,
  );
  const shortFold = useMediaQuery(SHORT_FOLD_QUERY);
  return (
    <ProgressiveReveal
      effect="zoom"
      fade={!opaque}
      className={className}
      countOnJump
      viewportInset={shortFold ? SHORT_FOLD_INSET : RESTING_INSET}
    >
      {children}
    </ProgressiveReveal>
  );
}
