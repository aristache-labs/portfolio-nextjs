"use client";

import type { ReactNode } from "react";
import { ProgressiveReveal } from "@/components/motion/ProgressiveReveal";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ABOUT_FOLD_QUERY } from "./AboutSequence";

/** Enter at the end of About, then start the counters after the panel settles. */
export function AboutResults({ children, className }: { children: ReactNode; className: string }) {
  const opaque = useMediaQuery(
    `(min-width: 1024px) and (pointer: fine), (orientation: landscape) and (pointer: coarse), ${ABOUT_FOLD_QUERY}`,
  );
  return (
    <ProgressiveReveal effect="zoom" fade={!opaque} className={className} countOnJump>
      {children}
    </ProgressiveReveal>
  );
}
