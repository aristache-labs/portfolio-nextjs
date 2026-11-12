"use client";

import { useEffect, type RefObject } from "react";
import { useScroll } from "framer-motion";
import { phaseProgress, smoothstep } from "@/lib/scroll-phase";
import { sectionTravelSkips, subscribeSectionNavigationComplete } from "@/lib/section-navigation";

/**
 * The share of the footer's travel each part uses, in reading order. Parts arrive during the
 * shorter lead-in and settle before the page ends.
 */
const PARTS: Record<string, [number, number]> = {
  title: [0.08, 0.32],
  subtitle: [0.12, 0.36],
  line: [0.16, 0.42],
  sparkle: [0.18, 0.42],
  logo: [0.18, 0.52],
  explore: [0.24, 0.6],
  legal: [0.28, 0.64],
  bar: [0.42, 0.82],
};

/**
 * How far the footer has come in, from its top entering the viewport (0) to the end of the page
 * (1). The footer never climbs high on screen, so the page end, not a viewport line, is the goal.
 */
export const footerProgress = (top: number, viewport: number, remaining: number) => {
  const travelled = Math.max(0, viewport - top);
  // Sub-pixel leftovers at the very bottom still count as the end.
  const left = remaining <= 1 ? 0 : remaining;
  if (travelled + left === 0) return 0;
  return travelled / (travelled + left);
};

/**
 * Drives each `[data-part]` inside the footer with its own `--entry` from scrolling. One way:
 * parts stay when scrolling back up, and keyboard focus inside shows everything at once.
 */
export function useFooterEntrance(footer: RefObject<HTMLElement | null>, enabled: boolean) {
  const { scrollY } = useScroll();

  useEffect(() => {
    const element = footer.current;
    if (!enabled || !element) return;
    const parts = [...element.querySelectorAll<HTMLElement>("[data-part]")];
    let peak = -1;
    const paint = (progress: number) => {
      for (const part of parts) {
        const [start, end] = PARTS[part.dataset.part ?? ""] ?? [0, 1];
        part.style.setProperty("--entry", String(smoothstep(phaseProgress(progress, start, end))));
      }
    };
    const update = () => {
      // The footer is far below a jump that only passes through; the landing refreshes it.
      if (sectionTravelSkips(element)) return;
      const remaining = document.documentElement.scrollHeight - innerHeight - window.scrollY;
      const progress = footerProgress(element.getBoundingClientRect().top, innerHeight, remaining);
      // The backdrop parallax follows the scroll both ways; only the parts are one way.
      element.style.setProperty("--footer-depth", String(progress));
      if (progress <= peak) return;
      peak = progress;
      paint(progress);
    };
    const reveal = () => {
      peak = 1;
      paint(1);
    };
    const focus = (event: FocusEvent) => {
      // Pointer focus happens between down and up. Moving its target then cancels the click.
      if (event.target instanceof HTMLElement && event.target.matches(":focus-visible")) reveal();
    };
    update();
    const unsubscribe = scrollY.on("change", update);
    const unsubscribeTravel = subscribeSectionNavigationComplete(update);
    window.addEventListener("resize", update);
    element.addEventListener("focusin", focus);
    // Late content above (images, lazy sections) changes the page height without a scroll event,
    // which would otherwise leave the last parts short of the end.
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    resize?.observe(document.body);
    return () => {
      resize?.disconnect();
      unsubscribe();
      unsubscribeTravel();
      window.removeEventListener("resize", update);
      element.removeEventListener("focusin", focus);
      element.style.removeProperty("--footer-depth");
      for (const part of parts) part.style.removeProperty("--entry");
    };
  }, [enabled, footer, scrollY]);
}
