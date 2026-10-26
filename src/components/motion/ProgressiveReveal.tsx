"use client";

import { m, useAnimationControls } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";

const VISIBLE = { opacity: 1, x: 0, y: 0 };

export function ProgressiveReveal({
  children,
  className,
  desktopDelay = 0,
  effect = "rise",
}: {
  children: ReactNode;
  className?: string;
  desktopDelay?: number;
  effect?: "rise" | "fade" | "slide" | "focus" | "cascade" | "line";
}) {
  const { mode, ready } = useAnimationPolicy();
  const controls = useAnimationControls();
  const element = useRef<HTMLDivElement>(null);
  const finished = useRef(false);

  useEffect(() => {
    if (!ready || !element.current) return;
    const node = element.current;
    let observer: IntersectionObserver | undefined;
    let active = true;
    const show = () => {
      finished.current = true;
      observer?.disconnect();
      controls.stop();
      controls.set(
        effect === "cascade"
          ? "visible"
          : effect === "focus"
            ? { ...VISIBLE, scale: 1 }
            : effect === "line"
              ? { ...VISIBLE, scaleX: 1 }
              : VISIBLE,
      );
    };
    const onScrollEnd = () => {
      // A jump can skip the observer's intersection entirely. Check once after scrolling.
      if (!finished.current && node.getBoundingClientRect().top < window.innerHeight) show();
    };
    const onFocus = () => {
      show();
    };

    // Never hide content that the visitor can already see, including after a resize.
    if (
      finished.current ||
      mode === "static" ||
      typeof IntersectionObserver !== "function" ||
      node.getBoundingClientRect().top <= window.innerHeight
    ) {
      show();
    } else {
      const expressive = mode === "expressive";
      observer = new IntersectionObserver(
        (entries) => {
          if (!active || finished.current) return;
          const entry = entries.find((item) => item.target === node);
          if (!entry) return;
          if (!entry.isIntersecting) {
            // Keep skipped content visible without animating above the viewport.
            if (entry.boundingClientRect.bottom <= 0) {
              observer?.disconnect();
              show();
            }
            return;
          }
          finished.current = true;
          observer?.disconnect();
          if (effect === "cascade") {
            void controls.start("visible");
            return;
          }
          void controls.start({
            opacity: [0, 1],
            ...(effect === "rise" ? { y: [expressive ? 38 : 28, 0] } : {}),
            ...(effect === "slide" ? { x: [expressive ? -24 : -12, 0] } : {}),
            ...(effect === "focus" ? { scale: [expressive ? 0.97 : 0.99, 1] } : {}),
            ...(effect === "line" ? { scaleX: [0, 1] } : {}),
            transition: {
              duration: 1,
              delay: expressive ? desktopDelay : 0,
              ease: effect === "rise" ? [0.44, 2, 0.72, 2] : [0.22, 1, 0.36, 1],
            },
          });
        },
        {
          // Wait until the element has moved beyond the bottom edge of the screen.
          rootMargin: `0px 0px -${Math.min(120, Math.round(window.innerHeight * 0.15))}px 0px`,
        },
      );
      // Prepare only offscreen content, before it can be seen during scrolling.
      controls.set(effect === "cascade" ? "hidden" : { opacity: 0, x: 0, y: 0 });
      observer.observe(node);
      window.addEventListener("scrollend", onScrollEnd);
      node.addEventListener("focusin", onFocus);
    }

    return () => {
      active = false;
      observer?.disconnect();
      window.removeEventListener("scrollend", onScrollEnd);
      node.removeEventListener("focusin", onFocus);
      controls.stop();
    };
  }, [controls, desktopDelay, effect, mode, ready]);

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
                  duration: mode === "static" ? 0 : 1,
                  staggerChildren: mode === "expressive" ? 0.045 : 0,
                  ease: [0.22, 1, 0.36, 1],
                },
              },
            }
          : undefined
      }
    >
      {children}
    </m.div>
  );
}
