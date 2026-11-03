"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import styles from "./experience-layout.module.css";

export const EXPERIENCE_PORTRAIT_QUERY = "(max-width: 767px) and (orientation: portrait)";
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
  useEffect(() => {
    const node = target.current;
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
  }, [mode, ready]);
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
