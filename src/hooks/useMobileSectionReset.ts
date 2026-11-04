"use client";

import { useEffect, useRef, type RefObject } from "react";
import { flushSync } from "react-dom";
import { useMediaQuery } from "./useMediaQuery";
import {
  sectionNavigationInProgress,
  subscribeSectionNavigationComplete,
} from "@/lib/section-navigation";

export const MOBILE_SECTION_RESET_QUERY =
  "(max-width: 767px) and (orientation: portrait), (orientation: landscape) and (pointer: coarse) and (max-width: 1023px) and (max-height: 500px)";

let anchorSuppressions = 0;
let previousAnchor = "";

function suppressScrollAnchoring() {
  const root = document.documentElement;
  if (anchorSuppressions++ === 0) {
    previousAnchor = root.style.overflowAnchor;
    root.style.overflowAnchor = "none";
  }
  // Several expanded Experience cards may collapse in the same frame.
  return () =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (--anchorSuppressions === 0) root.style.overflowAnchor = previousAnchor;
      }),
    );
}

/** Reset only transient mobile state after the entire owning section leaves the viewport. */
export function useMobileSectionReset(
  ref: RefObject<HTMLElement | null>,
  changed: boolean,
  reset: () => void,
) {
  const mobile = useMediaQuery(MOBILE_SECTION_RESET_QUERY);
  const resetRef = useRef(reset);
  useEffect(() => {
    resetRef.current = reset;
  });

  useEffect(() => {
    const section = ref.current?.closest("section");
    if (!mobile || !changed || !section || typeof IntersectionObserver !== "function") return;
    let frame = 0;
    let active = true;
    let resetDone = false;
    let departed = false;
    const check = () => {
      if (!active || resetDone || sectionNavigationInProgress()) return;
      const bounds = section.getBoundingClientRect();
      const headerBottom = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
      if (!departed && bounds.bottom > headerBottom && bounds.top < innerHeight) return;
      resetDone = true;
      // Collapsing content above the reader must not move the next section in the viewport.
      const following = [...document.querySelectorAll<HTMLElement>("section[id]")].find(
        (node) =>
          !section.contains(node) &&
          !!(section.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING),
      );
      const anchor = bounds.top < 0 ? following : undefined;
      const restoreAnchoring = anchor ? suppressScrollAnchoring() : undefined;
      const before = anchor?.getBoundingClientRect().top;
      try {
        flushSync(() => resetRef.current());
        if (anchor && before !== undefined) {
          const delta = anchor.getBoundingClientRect().top - before;
          if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: "instant" });
        }
      } finally {
        restoreAnchoring?.();
      }
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(check);
    };
    const observer = new IntersectionObserver(schedule, { threshold: 0 });
    observer.observe(section);
    const unsubscribe = subscribeSectionNavigationComplete((target, arrived) => {
      departed = arrived && target !== section;
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
