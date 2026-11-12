"use client";

import { useSectionNavigation } from "@/hooks/useSectionNavigation";
import { createTravelGate, sectionNavigationPending } from "@/lib/section-navigation";
import { MOBILE_REVEAL_DEPTH, revealInset } from "@/lib/reveal-depth";

import { useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import styles from "./experience-layout.module.css";
import { PORTRAIT_PHONE_QUERY } from "@/hooks/useMediaQuery";

export const EXPERIENCE_PORTRAIT_QUERY = PORTRAIT_PHONE_QUERY;
export const EXPERIENCE_LANDSCAPE_QUERY =
  "(orientation: landscape) and (pointer: coarse) and (max-width: 1023px) and (max-height: 500px)";

export function useExperienceMobileReveal(ref: RefObject<HTMLDivElement | null>, enabled = true) {
  const { mode, ready } = useAnimationPolicy();
  const navigation = useSectionNavigation(ref);
  useLayoutEffect(() => {
    if (!enabled) return;
    const node = ref.current;
    if (navigation.pending && node && mode !== "static") {
      node.dataset.mobileReveal = "armed";
      return () => {
        delete node.dataset.mobileReveal;
      };
    }
    if (!node || !ready || mode === "static" || typeof IntersectionObserver !== "function") return;
    node.dataset.mobileReveal = "armed";
    const reveal = () => {
      node.dataset.mobileReveal = "play";
      observer.disconnect();
    };
    const focus = () => {
      node.dataset.mobileReveal = "static";
      observer.disconnect();
    };
    const inset = revealInset(MOBILE_REVEAL_DEPTH);
    const gate = createTravelGate(node, reveal, inset);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (sectionNavigationPending(node) || gate.passing()) return;
        if (
          entry?.isIntersecting ||
          (entry && entry.boundingClientRect.bottom <= 0 && !gate.isSkipped())
        )
          reveal();
      },
      { rootMargin: `0px 0px -${inset}px 0px`, threshold: 0.08 },
    );
    observer.observe(node);
    node.addEventListener("focusin", focus);
    return () => {
      gate.dispose();
      observer.disconnect();
      node.removeEventListener("focusin", focus);
      delete node.dataset.mobileReveal;
    };
  }, [enabled, mode, ready, navigation.pending, navigation.replay, ref]);
}

/** Each role observes its own stationary box and remains visible after its first entrance. */
export function ExperienceMobileReveal({
  children,
  kind,
  className,
}: {
  children: ReactNode;
  kind: "title" | "description" | "entry";
  className?: string;
}) {
  const target = useRef<HTMLDivElement>(null);
  useExperienceMobileReveal(target);
  return (
    <div
      ref={target}
      className={`${styles.mobileReveal} ${className ?? ""}`}
      data-experience-reveal={kind}
    >
      {children}
    </div>
  );
}
