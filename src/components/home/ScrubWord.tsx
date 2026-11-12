"use client";

import { useEffect, useRef } from "react";
import { createTravelGate } from "@/lib/section-navigation";
import css from "./scrub-word.module.css";

/** An outlined word that a timeline playhead fills in once, when it first scrolls into view. */
export function ScrubWord({ children }: { children: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      node.dataset.live = "";
      return;
    }
    const play = () => {
      node.dataset.live = "";
      observer.disconnect();
    };
    const gate = createTravelGate(node, play);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (gate.passing() || !entry?.isIntersecting) return;
        play();
      },
      { threshold: 0.8 },
    );
    observer.observe(node);
    return () => {
      gate.dispose();
      observer.disconnect();
    };
  }, []);

  return (
    <span ref={ref} data-text={children} className={css.word}>
      {children}
      <span aria-hidden className={css.ruler} />
      <span aria-hidden className={css.head} />
    </span>
  );
}
