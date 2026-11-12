"use client";

import { useSectionNavigation } from "@/hooks/useSectionNavigation";
import { createTravelGate, sectionNavigationPending } from "@/lib/section-navigation";
import { MOBILE_REVEAL_DEPTH } from "@/lib/reveal-depth";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { FOLD_VIEWPORT_QUERY, PINNED_SCENE_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";

/** Same wait as the other phone reveals: the block starts once it is properly on screen. */
const DEFAULT_ROOT_MARGIN = `0px 0px -${MOBILE_REVEAL_DEPTH * 100}% 0px`;

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
    useMediaQuery(
      `(orientation: landscape) and (pointer: coarse) and (min-height: 501px), ${FOLD_VIEWPORT_QUERY}`,
    ) && mode !== "static";
  const rootMargin = ((desktopPinned || tallTouch) && pinnedRootMargin) || DEFAULT_ROOT_MARGIN;

  const navigation = useSectionNavigation(ref, () => !played.current);
  useLayoutEffect(() => {
    const node = ref.current;
    if (navigation.pending && node && mode !== "static") {
      node.dataset.reveal = "armed";
      return () => {
        delete node.dataset.reveal;
      };
    }
    if (!ready || !node || played.current || mode === "static") return;
    if (typeof IntersectionObserver !== "function") return;
    node.dataset.reveal = "armed";
    const play = () => {
      played.current = true;
      node.dataset.reveal = "play";
      observer.disconnect();
    };
    const gate = createTravelGate(node, play);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (sectionNavigationPending(node) || gate.passing()) return;
        if (!entry?.isIntersecting) return;
        play();
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => {
      gate.dispose();
      observer.disconnect();
      if (!played.current) delete node.dataset.reveal;
    };
  }, [mode, ready, rootMargin, navigation.pending, navigation.replay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
