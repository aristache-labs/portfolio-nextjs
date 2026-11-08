"use client";

import { useEffect, useRef } from "react";
import styles from "./card-border-glow.module.css";

/** A decorative perimeter, paused while the card or browser tab is out of view. */
export function CardBorderGlow({
  variant = "default",
  rotate = true,
}: {
  variant?: "default" | "subtle";
  rotate?: boolean;
}) {
  const element = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = element.current;
    if (!node) return;
    let visible = typeof IntersectionObserver === "undefined";
    const update = () => {
      node.dataset.active = String(visible && !document.hidden);
    };
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            update();
          });
    observer?.observe(node);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return (
    <span
      ref={element}
      aria-hidden="true"
      className={styles.border}
      data-variant={variant}
      data-rotate={rotate}
    >
      <span className={styles.glow} />
      <span className={styles.ring} />
    </span>
  );
}
