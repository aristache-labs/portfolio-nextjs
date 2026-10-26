"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { cn } from "@/utils/cn";
import styles from "./shine-border.module.css";

const BRAND_COLORS = ["var(--brand-deep)", "var(--brand-mid)", "var(--brand-bright)"];

/** A masked decorative layer that follows its parent's radius without covering its content. */
export function ShineBorder({
  className,
  duration = 14,
  borderWidth = 3,
  shineColor = BRAND_COLORS,
}: {
  className?: string;
  duration?: number;
  borderWidth?: number;
  shineColor?: string | string[];
}) {
  const element = useRef<HTMLDivElement>(null);
  const { mode, ready } = useAnimationPolicy();
  const enabled = ready && mode !== "static";
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const node = element.current;
    if (!enabled || !node) return;
    let inView = false;
    let active = true;
    const sync = () => {
      if (active) setRunning(inView && !document.hidden);
    };
    let observer: IntersectionObserver | undefined;
    let fallback: number | undefined;
    if (typeof IntersectionObserver === "function") {
      observer = new IntersectionObserver((entries) => {
        const entry = entries.find((item) => item.target === node);
        if (!entry) return;
        inView = entry.isIntersecting;
        sync();
      });
      observer.observe(node);
    } else {
      fallback = requestAnimationFrame(() => {
        inView = true;
        sync();
      });
    }
    document.addEventListener("visibilitychange", sync);
    return () => {
      active = false;
      if (fallback !== undefined) cancelAnimationFrame(fallback);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [enabled]);

  const colors = Array.isArray(shineColor) ? shineColor : [shineColor];
  return (
    <div
      ref={element}
      aria-hidden="true"
      className={cn(styles.border, className)}
      style={
        {
          "--shine-duration": `${duration}s`,
          "--shine-width": `${borderWidth}px`,
          backgroundImage: `radial-gradient(transparent 35%, ${colors.join(", ")}, transparent 90%)`,
          animationPlayState: enabled && running ? "running" : "paused",
        } as CSSProperties
      }
    />
  );
}
