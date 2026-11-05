"use client";

import type { RefObject } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { MOTION_CONDITIONS, type MotionConditions } from "@/lib/motion-queries";

/**
 * The single way a section registers scroll motion. One `gsap.matchMedia` per call, scoped to
 * `scope` so every selector stays inside the section and everything is reverted on unmount or
 * when a breakpoint flips. Reduced motion never runs `setup`, so content stays in its final,
 * visible state.
 */
export function useMotionMatch(
  scope: RefObject<HTMLElement | null>,
  setup: (conditions: MotionConditions) => void | (() => void),
  dependencies: unknown[] = [],
) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_CONDITIONS, (context) => {
        const conditions = context.conditions as MotionConditions;
        if (conditions.reduced) return;
        return setup(conditions);
      });
      return () => mm.revert();
    },
    { scope, dependencies, revertOnUpdate: true },
  );
}
