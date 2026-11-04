"use client";

import type { ReactNode } from "react";
import { ProgressiveReveal } from "@/components/motion/ProgressiveReveal";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/** Enter at the end of About, then start the counters after the panel settles. */
export function AboutResults({ children, className }: { children: ReactNode; className: string }) {
  const opaque = useMediaQuery(
    "(min-width: 1024px) and (pointer: fine), (orientation: landscape) and (pointer: coarse)",
  );
  return (
    <ProgressiveReveal effect="zoom" fade={!opaque} className={className} countOnJump>
      {children}
    </ProgressiveReveal>
  );
}
