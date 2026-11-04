"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useMediaQuery } from "./useMediaQuery";
import {
  sectionNavigationInProgress,
  subscribeSectionNavigationComplete,
} from "@/lib/section-navigation";

export const MOBILE_SECTION_RESET_QUERY =
  "(max-width: 767px) and (orientation: portrait), (orientation: landscape) and (pointer: coarse) and (max-width: 1023px) and (max-height: 500px)";

/**
 * Keep mobile state while reading farther down the page; reset on returning to its beginning.
 * Collapsing content above the reader forces a scroll correction that iOS Safari renders as a
 * visible flash, so the height only ever changes at or below the reader.
 */
export function useMobileSectionReset(
  ref: RefObject<HTMLElement | null>,
  changed: boolean,
  reset: () => void,
  /** Defers checks (e.g. while a dialog is open) without forgetting a recorded departure. */
  paused = false,
) {
  const mobile = useMediaQuery(MOBILE_SECTION_RESET_QUERY);
  const resetRef = useRef(reset);
  const pausedRef = useRef(paused);
  useEffect(() => {
    resetRef.current = reset;
    pausedRef.current = paused;
  });

  useEffect(() => {
    const section = ref.current?.closest("section");
    if (!mobile || !changed || !section || typeof IntersectionObserver !== "function") return;
    let frame = 0;
    let active = true;
    let resetDone = false;
    let departed = false;
    // A sticky heading can stay visible deep inside its section, so an in-flow marker wins.
    const start =
      section.querySelector<HTMLElement>("[data-section-reset-start]") ??
      section.querySelector("h2") ??
      section;
    const check = () => {
      if (!active || resetDone || pausedRef.current || sectionNavigationInProgress()) return;
      const bounds = section.getBoundingClientRect();
      const headerBottom = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
      const belowViewport = bounds.top >= innerHeight;
      if (bounds.bottom <= Math.max(headerBottom, 96) || belowViewport) departed = true;
      if (!departed) return;
      const heading = start.getBoundingClientRect();
      const atBeginning = heading.top >= headerBottom && heading.bottom <= innerHeight;
      // Never shrink the document above the viewport or compensate with a scroll jump.
      if (!belowViewport && !atBeginning) return;
      resetDone = true;
      resetRef.current();
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(check);
    };
    // The heading can return while a long section still intersects the viewport.
    const observer = new IntersectionObserver(schedule, {
      rootMargin: "-96px 0px 0px",
      threshold: [0, 1],
    });
    observer.observe(section);
    if (start !== section) observer.observe(start);
    const unsubscribe = subscribeSectionNavigationComplete((target, arrived) => {
      if (arrived && target !== section) departed = true;
      schedule();
    });
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      unsubscribe();
    };
  }, [changed, mobile, ref]);
}
