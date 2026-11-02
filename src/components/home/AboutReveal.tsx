"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";

/**
 * Marks its box `data-reveal="armed"` until it scrolls into view, then `"play"`, so CSS can
 * stagger the children. Content is hidden only once script has armed it.
 */
export function AboutReveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const played = useRef(false);
  const { mode, ready } = useAnimationPolicy();

  useEffect(() => {
    const node = ref.current;
    if (!ready || !node || played.current || mode === "static") return;
    if (typeof IntersectionObserver !== "function") return;
    node.dataset.reveal = "armed";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        played.current = true;
        node.dataset.reveal = "play";
        observer.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (!played.current) delete node.dataset.reveal;
    };
  }, [mode, ready]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
