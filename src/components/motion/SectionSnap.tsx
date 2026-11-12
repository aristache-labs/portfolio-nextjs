"use client";

import { useEffect } from "react";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { useHydratedPathname } from "@/hooks/useHydratedPathname";
import { subscribeScroll } from "@/lib/scroll-state";
import { SNAP_IDLE_MS, settleOnNearestSection } from "@/lib/section-snap";
import { getSmoothScroll } from "@/lib/smooth-scroll";

/** A page lock either hides body overflow (site menu) or sets Radix's scroll-lock marker. */
function isPageLocked() {
  const { body } = document;
  return body.style.overflow === "hidden" || body.hasAttribute("data-scroll-locked");
}

/**
 * A very light settle for manual scrolling on desktop: once the page has stayed still, a section
 * start that is a few pixels away glides into its place, the same place the menu lands on. Only
 * expressive desktop pointers get it (the same ones that get Lenis), never reduced motion.
 */
export function SectionSnap() {
  const { mode } = useAnimationPolicy();
  const pathname = useHydratedPathname();
  const enabled = mode === "expressive" && pathname === "/";

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelGlide: (() => void) | null = null;
    let pointerDown = false;

    const settle = () => {
      timer = undefined;
      // A held pointer is a scrollbar drag, and Lenis still moving means the wheel has not
      // finished: both come back to this once they end.
      if (pointerDown || isPageLocked() || getSmoothScroll()?.isScrolling) return schedule();
      cancelGlide = settleOnNearestSection();
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(settle, SNAP_IDLE_MS);
    };
    const press = () => {
      pointerDown = true;
    };
    const release = () => {
      pointerDown = false;
      schedule();
    };

    const unsubscribe = subscribeScroll(schedule);
    window.addEventListener("pointerdown", press, { passive: true });
    window.addEventListener("pointerup", release, { passive: true });
    window.addEventListener("pointercancel", release, { passive: true });
    return () => {
      clearTimeout(timer);
      cancelGlide?.();
      unsubscribe();
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, [enabled]);

  return null;
}

export default SectionSnap;
