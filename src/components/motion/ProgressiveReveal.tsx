"use client";

import { m, useAnimationControls } from "framer-motion";
import { useLayoutEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { createRevealSequence, RevealSequence } from "./RevealSequence";
import { useSectionNavigation } from "@/hooks/useSectionNavigation";
import { REVEAL_DEPTH, revealInset } from "@/lib/reveal-depth";
import {
  sectionNavigationPending,
  sectionTravelSkips,
  subscribeSectionNavigationComplete,
} from "@/lib/section-navigation";

const VISIBLE = { opacity: 1, x: 0, y: 0 };

export type ProgressiveRevealProps = {
  children: ReactNode;
  className?: string;
  /**
   * Classes for the element that actually fades in the from-right effects. A glass surface
   * belongs here: a fading ancestor would hide its backdrop blur until the fade ends.
   */
  innerClassName?: string;
  desktopDelay?: number;
  duration?: number;
  delay?: number;
  staggerChildren?: number;
  ease?: [number, number, number, number];
  viewportInset?: number;
  /** Keep the first counter animation when anchor navigation skips the entrance. */
  countOnJump?: boolean;
  effect?:
    | "rise"
    | "fade"
    | "fade-from-left"
    | "slide"
    | "slide-from-right"
    | "fade-from-right"
    | "focus"
    | "zoom"
    | "cascade"
    | "line";
  /** Glass surfaces can keep their background visible while their entrance moves or scales. */
  fade?: boolean;
};

export function useProgressiveReveal({
  desktopDelay = 0.3,
  duration = 1,
  delay,
  effect = "rise",
  fade = true,
  ease,
  viewportInset,
  countOnJump = false,
  element,
  enabled = true,
}: Omit<ProgressiveRevealProps, "children" | "className" | "innerClassName"> & {
  element: RefObject<HTMLDivElement | null>;
  enabled?: boolean;
}) {
  const { mode, ready } = useAnimationPolicy();
  const controls = useAnimationControls();
  const finished = useRef(false);
  const sequence = useMemo(() => createRevealSequence(), []);
  const navigation = useSectionNavigation(element, () => !finished.current);
  const fromRight = effect === "slide-from-right" || effect === "fade-from-right";

  useLayoutEffect(() => {
    if (!enabled) {
      finished.current = false;
      controls.set({ ...VISIBLE, scale: 1, scaleX: 1 });
      return;
    }
    if (!ready || !element.current) return;
    const node = element.current;
    if (navigation.pending) {
      controls.stop();
      sequence.publish("prepared");
      return;
    }
    let observer: IntersectionObserver | undefined;
    let unsubscribeTravel: (() => void) | undefined;
    let active = true;
    let settled = false;
    // A section jump passed this element on its way elsewhere. It stays prepared and plays on the
    // first real visit instead of being finished off-screen or animated mid-jump.
    let skippedByTravel = false;
    let rightStart = 0;
    // Without an explicit inset the entrance waits until the element is well into the screen.
    const inset =
      viewportInset === undefined
        ? revealInset(REVEAL_DEPTH)
        : Math.min(viewportInset, revealInset(0.15));
    let enterEntrance: (() => void) | undefined;
    const setRightStart = (bounds: DOMRectReadOnly) => {
      rightStart = Math.max(0, window.innerWidth - bounds.left) + 24;
      controls.set({ opacity: effect === "fade-from-right" ? 0 : 1, x: rightStart, y: 0 });
    };
    const prepareRightSlide = () => {
      if (!active || finished.current || sectionNavigationPending(node)) return;
      setRightStart(node.getBoundingClientRect());
    };

    const show = (measured?: DOMRectReadOnly) => {
      const needsCount = countOnJump && !finished.current && mode !== "static";
      const bounds = needsCount ? (measured ?? node.getBoundingClientRect()) : undefined;
      const countVisible =
        bounds !== undefined && bounds.top < window.innerHeight && bounds.bottom > 0;
      settled = true;
      finished.current = true;
      observer?.disconnect();
      controls.stop();
      controls.set(
        effect === "cascade"
          ? "visible"
          : effect === "focus" || effect === "zoom"
            ? { ...VISIBLE, scale: 1 }
            : effect === "line"
              ? { ...VISIBLE, scaleX: 1 }
              : VISIBLE,
      );
      sequence.publish(countVisible ? "complete" : "static");
    };
    const onScrollEnd = () => {
      if (finished.current || sectionNavigationPending(node)) return;
      if (skippedByTravel || sectionTravelSkips(node)) return;
      // The observer owns the first entrance after our explicit navigation completion.
      const bounds = node.getBoundingClientRect();
      if (navigation.replay && bounds.top < window.innerHeight && bounds.bottom > 0) return;
      // A jump can skip the observer's intersection entirely. Check once after scrolling.
      if (bounds.top >= window.innerHeight) return;
      // Resting inside the wait band, it has not had its turn yet: play it, do not pop it in.
      const inBand = bounds.top >= window.innerHeight - inset && bounds.bottom > 0;
      if (inBand && enterEntrance) enterEntrance();
      else show(bounds);
    };
    const onFocus = () => {
      show();
    };

    const staticContent =
      finished.current || mode === "static" || typeof IntersectionObserver !== "function";
    const needsBounds =
      (!staticContent && (!navigation.replay || fromRight)) ||
      (countOnJump && !finished.current && mode !== "static");
    const bounds = needsBounds ? node.getBoundingClientRect() : undefined;
    const visible = staticContent || (!navigation.replay && bounds!.top <= window.innerHeight);

    // Never hide content that the visitor can already see, including after a resize.
    if (visible || finished.current) {
      show(bounds);
    } else {
      const expressive = mode === "expressive";
      const enter = () => {
        skippedByTravel = false;
        finished.current = true;
        observer?.disconnect();
        if (effect === "cascade") {
          void controls.start("visible").then(() => {
            if (active && !settled) sequence.publish("complete");
          });
          return;
        }
        const entrance = controls.start({
          opacity: effect === "slide-from-right" || !fade ? 1 : [0, 1],
          ...(effect === "rise" ? { y: [expressive ? 38 : 28, 0] } : {}),
          ...(effect === "slide" ? { x: [expressive ? -24 : -12, 0] } : {}),
          ...(effect === "fade-from-left" ? { x: [-48, 0] } : {}),
          ...(fromRight ? { x: [rightStart, 0] } : {}),
          ...(effect === "focus" ? { scale: [expressive ? 0.97 : 0.99, 1] } : {}),
          ...(effect === "zoom" ? { scale: [0.9, 1] } : {}),
          ...(effect === "line" ? { scaleX: [0, 1] } : {}),
          transition: {
            duration,
            delay: delay ?? (expressive ? desktopDelay : 0.3),
            ease: ease ?? (effect === "rise" ? [0.44, 2, 0.72, 2] : [0.22, 1, 0.36, 1]),
          },
        });
        if (effect === "zoom") {
          void entrance.then(() => {
            if (active && !settled) sequence.publish("complete");
          });
        }
      };
      enterEntrance = enter;
      observer = new IntersectionObserver(
        (entries) => {
          if (!active || finished.current || sectionNavigationPending(node)) return;
          const entry = entries.find((item) => item.target === node);
          if (!entry) return;
          // A jump is only passing through: stay prepared, play on the first real visit.
          if (sectionTravelSkips(node)) {
            skippedByTravel = true;
            return;
          }
          if (!entry.isIntersecting) {
            // Keep skipped content visible without animating above the viewport.
            if (entry.boundingClientRect.bottom <= 0 && !skippedByTravel) {
              observer?.disconnect();
              show(entry.boundingClientRect);
            }
            return;
          }
          enter();
        },
        {
          // Wait until the element has moved beyond the bottom edge of the screen.
          rootMargin: `0px 0px -${inset}px 0px`,
        },
      );
      // The jump has landed. If the page stopped with this element already on screen the observer
      // will not report it again, so start its entrance now. Anything above stays prepared.
      unsubscribeTravel = subscribeSectionNavigationComplete(() => {
        if (!active || finished.current || !skippedByTravel) return;
        const rect = node.getBoundingClientRect();
        if (rect.top < window.innerHeight - inset && rect.bottom > 0) enter();
      });
      // Prepare only offscreen content, before it can be seen during scrolling.
      if (fromRight) {
        setRightStart(bounds!);
        window.addEventListener("resize", prepareRightSlide);
      } else {
        controls.set(
          effect === "cascade"
            ? "hidden"
            : {
                opacity: fade ? 0 : 1,
                x: 0,
                y: 0,
                ...(effect === "zoom" && !fade ? { scale: 0.9 } : {}),
              },
        );
      }
      sequence.publish("prepared");
      observer.observe(node);
      window.addEventListener("scrollend", onScrollEnd);
      node.addEventListener("focusin", onFocus);
    }

    return () => {
      active = false;
      observer?.disconnect();
      unsubscribeTravel?.();
      window.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("resize", prepareRightSlide);
      node.removeEventListener("focusin", onFocus);
      controls.stop();
    };
  }, [
    controls,
    element,
    enabled,
    navigation.pending,
    navigation.replay,
    countOnJump,
    delay,
    desktopDelay,
    duration,
    ease,
    effect,
    fade,
    fromRight,
    mode,
    ready,
    sequence,
    viewportInset,
  ]);

  return { controls, sequence, mode, fromRight };
}

export function ProgressiveReveal({
  children,
  className,
  innerClassName,
  desktopDelay = 0.3,
  duration = 1,
  delay,
  staggerChildren,
  effect = "rise",
  fade = true,
  ease,
  viewportInset,
  countOnJump = false,
}: ProgressiveRevealProps) {
  const element = useRef<HTMLDivElement>(null);
  const { controls, sequence, mode, fromRight } = useProgressiveReveal({
    element,
    desktopDelay,
    duration,
    delay,
    staggerChildren,
    effect,
    fade,
    ease,
    viewportInset,
    countOnJump,
  });

  // Observe the stationary layout box: an offscreen translated target cannot intersect.
  if (fromRight) {
    return (
      <div ref={element} className={className}>
        <m.div
          className={innerClassName ? `w-full min-w-0 ${innerClassName}` : "w-full min-w-0"}
          initial={false}
          animate={controls}
        >
          {children}
        </m.div>
      </div>
    );
  }

  return (
    <m.div
      ref={element}
      className={className}
      initial={false}
      animate={controls}
      variants={
        effect === "cascade"
          ? {
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  duration: mode === "static" ? 0 : duration,
                  delay: mode === "static" ? 0 : (delay ?? 0.3),
                  staggerChildren:
                    mode === "static"
                      ? 0
                      : (staggerChildren ?? (mode === "expressive" ? 0.245 : 0)),
                  ease: [0.22, 1, 0.36, 1],
                },
              },
            }
          : undefined
      }
    >
      {effect === "zoom" || effect === "cascade" ? (
        <RevealSequence.Provider value={sequence}>{children}</RevealSequence.Provider>
      ) : (
        children
      )}
    </m.div>
  );
}
