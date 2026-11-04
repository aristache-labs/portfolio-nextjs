"use client";

import { useSectionNavigation } from "@/hooks/useSectionNavigation";
import { sectionNavigationPending } from "@/lib/section-navigation";

import { useLayoutEffect, useRef, type ComponentProps, type CSSProperties } from "react";
import { ProgressiveReveal } from "@/components/motion/ProgressiveReveal";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import styles from "./project-motion.module.css";

export const PROJECTS_PORTRAIT_QUERY = "(max-width: 767px) and (orientation: portrait)";
export const PROJECTS_LANDSCAPE_QUERY =
  "(orientation: landscape) and (pointer: coarse) and (max-width: 1023px) and (max-height: 500px)";

/** Mobile reveals each layout box once; desktop retains its existing reveal behavior. */
export function ProjectsArrival({
  kind = "card",
  order = 0,
  children,
  className,
  ...desktopProps
}: ComponentProps<typeof ProgressiveReveal> & {
  kind?: "heading" | "featured" | "recent" | "card" | "label" | "action";
  order?: number;
}) {
  const portrait = useMediaQuery(PROJECTS_PORTRAIT_QUERY);
  const landscape = useMediaQuery(PROJECTS_LANDSCAPE_QUERY);
  const mobile = portrait || landscape;
  const { ready, mode } = useAnimationPolicy();
  const ref = useRef<HTMLDivElement>(null);
  const navigation = useSectionNavigation(ref);
  useLayoutEffect(() => {
    const node = ref.current;
    if (navigation.pending && node && mode !== "static") {
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
  }, [mobile, ready, mode, navigation.pending, navigation.replay]);
  if (!mobile) {
    return (
      <ProgressiveReveal {...desktopProps} className={className}>
        {children}
      </ProgressiveReveal>
    );
  }
  return (
    <div
      ref={ref}
      className={`${styles.arrival} ${className ?? ""}`}
      data-project-kind={kind}
      style={{ "--project-delay": `${(order % 2) * 80}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
