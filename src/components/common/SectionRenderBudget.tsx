"use client";

import { useEffect } from "react";
import { TOUCH_LANDSCAPE_QUERY } from "@/lib/motion-queries";

const SECTIONS = "main section[id], footer";
const RESIZE_SETTLE_MS = 300;

/**
 * Landscape touch screens (iPhone Safari) ran out of memory when scrolling the whole page fast:
 * every section kept its layers alive. With `content-visibility: auto` (see globals.css) the
 * sections off screen are not rendered. A skipped section is laid out at its placeholder size,
 * so each section's real height is measured first and kept as that placeholder. Positions then
 * stay the same, and section jumps and scroll offsets keep landing where they did. The heights
 * live as custom properties on <html>, never on the sections: React owns those elements, and a
 * style written there before they hydrate is a hydration mismatch.
 */
export function SectionRenderBudget() {
  useEffect(() => {
    const touchLandscape = window.matchMedia(TOUCH_LANDSCAPE_QUERY);
    const root = document.documentElement;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const key = (section: HTMLElement) => `--render-budget-${section.id || "footer"}`;

    const clear = () => {
      root.removeAttribute("data-render-budget");
      document.querySelectorAll<HTMLElement>(SECTIONS).forEach((section) => {
        root.style.removeProperty(key(section));
      });
    };

    const apply = () => {
      // Back to a fully rendered page first, so every height is the real one.
      clear();
      if (!touchLandscape.matches) return;
      const sections = [...document.querySelectorAll<HTMLElement>(SECTIONS)];
      const heights = sections.map((section) => section.offsetHeight);
      sections.forEach((section, index) => {
        root.style.setProperty(key(section), `${heights[index]}px`);
      });
      root.setAttribute("data-render-budget", "");
    };

    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(apply, RESIZE_SETTLE_MS);
    };

    // Browser chrome (the address bar) resizes the viewport while scrolling. Measuring again
    // would render every skipped section at once, so only a change of width does.
    let measuredWidth = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === measuredWidth) return;
      measuredWidth = window.innerWidth;
      schedule();
    };

    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    window.addEventListener("resize", onResize);
    touchLandscape.addEventListener("change", schedule);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("load", schedule);
      window.removeEventListener("resize", onResize);
      touchLandscape.removeEventListener("change", schedule);
      clear();
    };
  }, []);

  return null;
}
