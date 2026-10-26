"use client";

import { m, useAnimationControls } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";

const VISIBLE = { opacity: 1, y: 0 };

export function ProgressiveReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
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
      controls.stop();
      controls.set(VISIBLE);
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
      observer = new IntersectionObserver((entries) => {
        if (!active || finished.current) return;
        const entry = entries.find((item) => item.target === node);
        // A fast scroll can skip the viewport between observer deliveries.
        if (
          !entry ||
          (!entry.isIntersecting && entry.boundingClientRect.top > window.innerHeight)
        ) {
          return;
        }
        finished.current = true;
        observer?.disconnect();
        void controls.start({
          opacity: [0, 1],
          y: [expressive ? 38 : 28, 0],
          transition: {
            duration: 1,
            ease: [0.44, 2, 0.72, 2],
          },
        });
      });
      observer.observe(node);
    }

    return () => {
      active = false;
      observer?.disconnect();
      controls.stop();
    };
  }, [controls, mode, ready]);

  return (
    <m.div ref={element} className={className} initial={false} animate={controls}>
      {children}
    </m.div>
  );
}
