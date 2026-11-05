"use client";

import { useSectionNavigation } from "@/hooks/useSectionNavigation";
import { sectionNavigationPending } from "@/lib/section-navigation";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import styles from "./experience-layout.module.css";
import { PORTRAIT_PHONE_QUERY } from "@/hooks/useMediaQuery";

export const EXPERIENCE_PORTRAIT_QUERY = PORTRAIT_PHONE_QUERY;
export const EXPERIENCE_LANDSCAPE_QUERY =
  "(orientation: landscape) and (pointer: coarse) and (max-width: 1023px) and (max-height: 500px)";

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
  const { mode, ready } = useAnimationPolicy();
  const navigation = useSectionNavigation(target);
  useLayoutEffect(() => {
    const node = target.current;
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
      delete node.dataset.mobileReveal;
    };
  }, [mode, ready, navigation.pending, navigation.replay]);
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
