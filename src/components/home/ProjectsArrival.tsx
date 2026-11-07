"use client";

import { useSectionNavigation } from "@/hooks/useSectionNavigation";
import { sectionNavigationPending } from "@/lib/section-navigation";

import { useLayoutEffect, useRef, type CSSProperties, type RefObject } from "react";
import { m } from "framer-motion";
import {
  useProgressiveReveal,
  type ProgressiveRevealProps,
} from "@/components/motion/ProgressiveReveal";
import { RevealSequence } from "@/components/motion/RevealSequence";
import { useScrollEntrance } from "@/components/motion/ScrollEntrance";
import scrollCss from "@/components/motion/scroll-entrance.module.css";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { PORTRAIT_PHONE_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import styles from "./project-motion.module.css";

export const PROJECTS_PORTRAIT_QUERY = PORTRAIT_PHONE_QUERY;
export const PROJECTS_LANDSCAPE_QUERY =
  "(orientation: landscape) and (pointer: coarse) and (max-width: 1023px) and (max-height: 500px), (orientation: landscape) and (pointer: coarse) and (min-width: 1024px) and (max-width: 1180px) and (max-height: 800px)";

function ProjectsScrollDriver({
  element,
  lag,
}: {
  element: RefObject<HTMLDivElement | null>;
  lag?: number;
}) {
  useScrollEntrance(element, { enabled: true, lag });
  return null;
}

/** Mobile reveals each layout box once; desktop retains its existing reveal behavior. */
export function ProjectsArrival({
  kind = "card",
  order = 0,
  children,
  className,
  scrollFrom,
  scrollLag,
  plain = false,
  ...desktopProps
}: ProgressiveRevealProps & {
  kind?: "heading" | "featured" | "recent" | "card" | "label" | "action";
  order?: number;
  scrollFrom?: "left" | "right" | "below";
  scrollLag?: number;
  plain?: boolean;
}) {
  const portrait = useMediaQuery(PROJECTS_PORTRAIT_QUERY);
  const landscape = useMediaQuery(PROJECTS_LANDSCAPE_QUERY);
  const mobile = portrait || landscape;
  const { ready, mode } = useAnimationPolicy();
  const ref = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const fromRight =
    desktopProps.effect === "fade-from-right" || desktopProps.effect === "slide-from-right";
  const mobileRef = fromRight ? inner : ref;
  const scroll = !!scrollFrom && !mobile;
  const timed = !mobile && !scroll && !plain;
  const { controls, sequence } = useProgressiveReveal({
    ...desktopProps,
    element: ref,
    enabled: timed,
  });
  useLayoutEffect(() => {
    if (!timed) controls.set({ opacity: "", x: 0, y: 0, scale: 1, scaleX: 1 });
  });
  const navigation = useSectionNavigation(mobileRef);
  useLayoutEffect(() => {
    const node = mobileRef.current;
    if (mobile && navigation.pending && node && mode !== "static") {
      node.dataset.projectReveal = "armed";
      return () => {
        delete node.dataset.projectReveal;
      };
    }
    if (
      !mobile ||
      !ready ||
      !node ||
      mode === "static" ||
      typeof IntersectionObserver !== "function"
    )
      return;
    node.dataset.projectReveal = "armed";
    const reveal = () => {
      node.dataset.projectReveal = "play";
      observer.disconnect();
    };
    const focus = () => {
      node.dataset.projectReveal = "static";
      observer.disconnect();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (sectionNavigationPending(node)) return;
        if (entry?.isIntersecting || (entry && entry.boundingClientRect.bottom <= 0)) reveal();
      },
      { rootMargin: "0px 0px -24px 0px", threshold: 0.08 },
    );
    observer.observe(node);
    node.addEventListener("focusin", focus);
    return () => {
      observer.disconnect();
      node.removeEventListener("focusin", focus);
      delete node.dataset.projectReveal;
    };
  }, [mobile, ready, mode, navigation.pending, navigation.replay, mobileRef]);
  const driverClass = mobile ? styles.arrival : scroll ? scrollCss.entrance : "";
  const content = (
    <RevealSequence.Provider
      value={
        timed && (desktopProps.effect === "cascade" || desktopProps.effect === "zoom")
          ? sequence
          : null
      }
    >
      {children}
    </RevealSequence.Provider>
  );
  const motionProps = {
    initial: false as const,
    animate: controls,
    transformTemplate: timed ? undefined : () => "",
    "data-project-kind": mobile ? kind : undefined,
    "data-from": scroll ? scrollFrom : undefined,
    style: mobile ? ({ "--project-delay": `${(order % 2) * 80}ms` } as CSSProperties) : undefined,
  };
  const root = fromRight ? (
    <div ref={ref} className={className}>
      <m.div {...motionProps} ref={inner} className={`w-full min-w-0 ${driverClass}`}>
        {content}
      </m.div>
    </div>
  ) : (
    <m.div {...motionProps} ref={ref} className={`${className ?? ""} ${driverClass}`}>
      {content}
    </m.div>
  );
  return (
    <>
      {scroll && <ProjectsScrollDriver element={mobileRef} lag={scrollLag} />}
      {root}
    </>
  );
}
