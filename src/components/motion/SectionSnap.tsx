"use client";

import { useEffect } from "react";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { useHydratedPathname } from "@/hooks/useHydratedPathname";
import { subscribeScroll } from "@/lib/scroll-state";
import { SNAP_IDLE_MS, SNAP_TOUCH_IDLE_MS, settleOnNearestSection } from "@/lib/section-snap";
import { getSmoothScroll } from "@/lib/smooth-scroll";

/** A page lock either hides body overflow (site menu) or sets Radix's scroll-lock marker. */
function isPageLocked() {
  const { body } = document;
  return body.style.overflow === "hidden" || body.hasAttribute("data-scroll-locked");
}

/** A touch screen as the main input (phones and tablets, in either orientation). */
function isCoarsePointer() {
  return typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
}

/**
 * A very light settle for manual scrolling on desktop: once the page has stayed still, a section
 * start that is a few pixels away glides into its place, the same place the menu lands on. Only
 * expressive desktop pointers get it (the same ones that get Lenis), never reduced motion.
 */
export function SectionSnap() {
  const { mode } = useAnimationPolicy();
  const pathname = useHydratedPathname();
  // Touch screens (coarse pointer) get their own, gentler settle; reduced motion gets none.
  const touch = mode !== "expressive" && isCoarsePointer();
  const enabled = pathname === "/" && (mode === "expressive" || (mode !== "static" && touch));

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelGlide: (() => void) | null = null;
    let pointerDown = false;
    let fingers = 0;
    const idle = touch ? SNAP_TOUCH_IDLE_MS : SNAP_IDLE_MS;

    const settle = () => {
      timer = undefined;
      // A held pointer is a scrollbar drag, and Lenis still moving means the wheel has not
      // finished: both come back to this once they end.
      if (pointerDown || fingers > 0 || isPageLocked() || getSmoothScroll()?.isScrolling) {
        return schedule();
      }
      cancelGlide = settleOnNearestSection(touch);
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(settle, idle);
    };
    const press = () => {
      pointerDown = true;
    };
    const release = () => {
      pointerDown = false;
      schedule();
    };

    // Touch scrolling cancels pointer events as soon as the page moves, so fingers are counted
    // from touch events: the settle waits until every finger is up and the momentum has ended.
    const touchChange = (event: TouchEvent) => {
      fingers = event.touches.length;
      if (fingers === 0) schedule();
    };

    const unsubscribe = subscribeScroll(schedule);
    window.addEventListener("touchstart", touchChange, { passive: true });
    window.addEventListener("touchend", touchChange, { passive: true });
    window.addEventListener("touchcancel", touchChange, { passive: true });
    window.addEventListener("pointerdown", press, { passive: true });
    window.addEventListener("pointerup", release, { passive: true });
    window.addEventListener("pointercancel", release, { passive: true });
    return () => {
      clearTimeout(timer);
      cancelGlide?.();
      unsubscribe();
      window.removeEventListener("touchstart", touchChange);
      window.removeEventListener("touchend", touchChange);
      window.removeEventListener("touchcancel", touchChange);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, [enabled, touch]);

  return null;
}

export default SectionSnap;
