"use client";

import type { RefObject } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useMotionMatch } from "./useMotionMatch";

type BatchRevealOptions = {
  /** Start offset in px. Transform only, never layout. */
  y?: number;
  stagger?: number;
  start?: string;
};

/**
 * One-way entrance for a group of elements: each batch fades and rises once as it nears the
 * viewport and then stays. Scrolling back up never hides it again. One ScrollTrigger batch
 * replaces an IntersectionObserver per element.
 */
export function useBatchReveal(
  scope: RefObject<HTMLElement | null>,
  selector: string,
  { y = 24, stagger = 0.08, start = "top 88%" }: BatchRevealOptions = {},
) {
  useMotionMatch(scope, () => {
    const items = gsap.utils.toArray<HTMLElement>(selector, scope.current ?? undefined);
    if (items.length === 0) return;
    gsap.set(items, { autoAlpha: 0, y });
    ScrollTrigger.batch(items, {
      start,
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger,
          overwrite: true,
          clearProps: "transform,opacity,visibility",
        }),
    });
  });
}
