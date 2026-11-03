"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { PINNED_SCENE_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";

const DEFAULT_ROOT_MARGIN = "0px 0px -10% 0px";

/**
 * Marks its box `data-reveal="armed"` until it scrolls into view, then `"play"`, so CSS can
 * stagger the children. Content is hidden only once script has armed it.
 */
export function AboutReveal({
  children,
  className,
  pinnedRootMargin,
}: {
  children: ReactNode;
  className?: string;
  /** Replaces the default trigger only in the desktop pinned scene, where About rises over the hero. */
  pinnedRootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const played = useRef(false);
  const { mode, ready } = useAnimationPolicy();
  const desktopPinned = useMediaQuery(PINNED_SCENE_QUERY) && mode === "expressive";
  // Tall touch landscape only. Short phones keep the default trigger and their compact layout.
  const tallTouch =
    useMediaQuery("(orientation: landscape) and (pointer: coarse) and (min-height: 501px)") &&
    mode !== "static";
  const rootMargin = ((desktopPinned || tallTouch) && pinnedRootMargin) || DEFAULT_ROOT_MARGIN;

  useEffect(() => {
    const node = ref.current;
    if (!ready || !node || played.current || mode === "static") return;
    if (typeof IntersectionObserver !== "function") return;
    node.dataset.reveal = "armed";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        played.current = true;
        node.dataset.reveal = "play";
        observer.disconnect();
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (!played.current) delete node.dataset.reveal;
    };
  }, [mode, ready, rootMargin]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
