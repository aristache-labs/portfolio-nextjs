"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { phaseProgress, useAboutSequence } from "./AboutSequence";
import styles from "./about-sequence.module.css";

export function AboutMetric({
  children,
  className,
  index,
}: {
  children: ReactNode;
  className: string;
  index: number;
}) {
  const target = useRef<HTMLDivElement>(null);
  const sequence = useAboutSequence();
  useEffect(() => {
    const node = target.current;
    if (!node || !sequence) return;
    const update = (value: number) => {
      const start = sequence.pinned
        ? 0.45 + index * 0.12
        : (sequence.expressive ? 0.62 : 0.55) + index * 0.055;
      const progress = phaseProgress(
        value,
        start,
        start + (sequence.pinned ? 0.16 : sequence.expressive ? 0.2 : 0.12),
      );
      node.style.setProperty("--metric-opacity", String(0.55 + progress * 0.45));
      node.style.setProperty(
        "--metric-y",
        `${(1 - progress) * (sequence.pinned ? 32 : sequence.expressive ? 18 : 8)}px`,
      );
      node.style.setProperty(
        "--metric-scale",
        String(sequence.pinned ? 0.96 + progress * 0.04 : 1),
      );
    };
    update(sequence.progress.get());
    const unsubscribe = sequence.progress.on("change", update);
    return () => {
      unsubscribe();
      node.style.removeProperty("--metric-opacity");
      node.style.removeProperty("--metric-y");
      node.style.removeProperty("--metric-scale");
    };
  }, [index, sequence]);
  return (
    <div ref={target} className={`${className} ${styles.metric}`}>
      {children}
    </div>
  );
}
