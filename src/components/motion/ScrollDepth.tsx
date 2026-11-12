"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useScroll } from "framer-motion";
import { sectionTravelSkips, subscribeSectionNavigationComplete } from "@/lib/section-navigation";

/**
 * Publishes `--depth` from -1 (frame high on screen) to 1 (frame low), so content inside a fixed
 * frame can drift against the scroll. Without `enabled` it is a plain wrapper.
 */
export function ScrollDepth({
  enabled,
  className,
  children,
}: {
  enabled: boolean;
  className?: string;
  children: ReactNode;
}) {
  const node = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  useEffect(() => {
    const element = node.current;
    if (!enabled || !element) return;
    const update = () => {
      // Sections a jump only passes through need no per-frame depth; the landing refreshes them.
      if (sectionTravelSkips(element)) return;
      const bounds = element.getBoundingClientRect();
      const offset = bounds.top + bounds.height / 2 - innerHeight / 2;
      const depth = Math.max(-1, Math.min(1, offset / (innerHeight / 2 + bounds.height / 2)));
      element.style.setProperty("--depth", depth.toFixed(4));
    };
    update();
    const unsubscribe = scrollY.on("change", update);
    const unsubscribeTravel = subscribeSectionNavigationComplete(update);
    window.addEventListener("resize", update);
    return () => {
      unsubscribe();
      unsubscribeTravel();
      window.removeEventListener("resize", update);
      element.style.removeProperty("--depth");
    };
  }, [enabled, scrollY]);

  return (
    <div ref={node} data-depth={enabled ? "" : undefined} className={className}>
      {children}
    </div>
  );
}
