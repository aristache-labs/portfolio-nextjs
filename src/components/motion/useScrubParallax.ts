"use client";

import type { RefObject } from "react";
import { gsap } from "@/lib/gsap";
import { useMotionMatch } from "./useMotionMatch";

type ScrubParallaxOptions = {
  /** Drift in percent of the element's own height, either side of centre. */
  drift?: number;
  /** Which ancestor's travel through the viewport drives the scrub. */
  triggerSelector?: string;
};

/**
 * Scroll-linked vertical drift, transform only. The element must be scaled up inside a clipping
 * frame by more than `drift` on each side (scale >= 1 + 2 * drift / 100), or the drift shows
 * a gap at the frame edge.
 */
export function useScrubParallax(
  scope: RefObject<HTMLElement | null>,
  selector: string,
  { drift = 6, triggerSelector }: ScrubParallaxOptions = {},
) {
  useMotionMatch(scope, () => {
    gsap.utils.toArray<HTMLElement>(selector, scope.current ?? undefined).forEach((element) => {
      const trigger =
        (triggerSelector ? element.closest<HTMLElement>(triggerSelector) : null) ??
        element.parentElement ??
        element;
      gsap.fromTo(
        element,
        { yPercent: -drift },
        {
          yPercent: drift,
          ease: "none",
          scrollTrigger: { trigger, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    });
  });
}
