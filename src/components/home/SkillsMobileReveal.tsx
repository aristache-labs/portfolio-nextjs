"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import styles from "./skills-mobile-motion.module.css";

export const SKILLS_MOBILE_PORTRAIT = "(max-width: 767px) and (orientation: portrait)";
export const SKILLS_MOBILE_LANDSCAPE =
  "(orientation: landscape) and (pointer: coarse) and (max-width: 1023px) and (max-height: 500px)";

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
  const { mode, ready } = useAnimationPolicy();
  useEffect(() => {
    const node = ref.current;
    if (!node || !ready || mode === "static" || typeof IntersectionObserver !== "function") return;
    node.dataset.reveal = "armed";
    const show = () => {
      node.dataset.reveal = "play";
      observer.disconnect();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
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
  }, [mode, ready]);
  return (
    <div ref={ref} className={`${className ?? ""} ${styles.reveal}`} data-kind={kind}>
      {children}
    </div>
  );
}
