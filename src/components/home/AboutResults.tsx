"use client";

import type { ReactNode } from "react";
import { ProgressiveReveal } from "@/components/motion/ProgressiveReveal";

/** Enter at the end of About, then start the counters after the panel settles. */
export function AboutResults({ children, className }: { children: ReactNode; className: string }) {
  return (
    <ProgressiveReveal effect="zoom" className={className}>
      {children}
    </ProgressiveReveal>
  );
}
