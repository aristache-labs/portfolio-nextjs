"use client";

import { useSectionNavigation } from "@/hooks/useSectionNavigation";
import { sectionNavigationPending } from "@/lib/section-navigation";

import { useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import styles from "./skills-mobile-motion.module.css";
import { PORTRAIT_PHONE_QUERY } from "@/hooks/useMediaQuery";

export const SKILLS_MOBILE_PORTRAIT = PORTRAIT_PHONE_QUERY;
export const SKILLS_MOBILE_LANDSCAPE =
  "(orientation: landscape) and (pointer: coarse) and (max-width: 1023px) and (max-height: 500px)";

export function useSkillsMobileReveal(ref: RefObject<HTMLDivElement | null>, enabled = true) {
  const { mode, ready } = useAnimationPolicy();
  const navigation = useSectionNavigation(ref);
  useLayoutEffect(() => {
    if (!enabled) return;
    const node = ref.current;
    if (navigation.pending && node && mode !== "static") {
      node.dataset.reveal = "armed";
      return () => {
        delete node.dataset.reveal;
      };
    }
    if (!node || !ready || mode === "static" || typeof IntersectionObserver !== "function") return;
    node.dataset.reveal = "armed";
    const show = () => {
      node.dataset.reveal = "play";
      observer.disconnect();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (sectionNavigationPending(node)) return;
        if (entry?.isIntersecting || (entry && entry.boundingClientRect.bottom < 0)) show();
      },
      { rootMargin: "0px 0px -32px 0px", threshold: 0.1 },
    );
    observer.observe(node);
    node.addEventListener("focusin", show);
    return () => {
      observer.disconnect();
      node.removeEventListener("focusin", show);
      delete node.dataset.reveal;
    };
  }, [enabled, mode, ready, navigation.pending, navigation.replay, ref]);
}

/** Observe the layout box, while CSS animates its children independently of parallax. */
export function SkillsMobileReveal({
  children,
  className,
  kind,
}: {
  children: ReactNode;
  className?: string;
  kind: "title" | "description" | "quote";
}) {
  const ref = useRef<HTMLDivElement>(null);
  useSkillsMobileReveal(ref);
  return (
    <div ref={ref} className={`${className ?? ""} ${styles.reveal}`} data-kind={kind}>
      {children}
    </div>
  );
}
