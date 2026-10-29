"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useScroll } from "framer-motion";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import styles from "./about-portrait-motion.module.css";
import { phaseProgress, useAboutSequence } from "./AboutSequence";

function paintPortrait(node: HTMLDivElement, value: number, expressive: boolean) {
  const progress = Math.max(0, Math.min(1, value));
  node.style.setProperty("--portrait-mask", `${(1 - Math.min(1, progress / 0.85)) * 100}%`);
  node.style.setProperty("--portrait-image-y", `${(1 - progress * 2) * (expressive ? 4 : 1.5)}%`);
  node.style.setProperty(
    "--portrait-image-scale",
    String(expressive ? 1.18 - progress * 0.08 : 1.08 - progress * 0.04),
  );
}

function SequencePortrait({ target }: { target: React.RefObject<HTMLDivElement | null> }) {
  const sequence = useAboutSequence();
  useEffect(() => {
    const node = target.current;
    if (!node || !sequence) return;
    const update = (value: number) =>
      paintPortrait(
        node,
        phaseProgress(value, sequence.expressive ? 0.16 : 0.08, sequence.expressive ? 0.64 : 0.42),
        sequence.expressive,
      );
    update(sequence.progress.get());
    const unsubscribe = sequence.progress.on("change", update);
    return () => {
      unsubscribe();
      for (const name of ["mask", "image-y", "image-scale"])
        node.style.removeProperty(`--portrait-${name}`);
    };
  }, [sequence, target]);
  return null;
}

function PortraitScroll({
  target,
  expressive,
}: {
  target: React.RefObject<HTMLDivElement | null>;
  expressive: boolean;
}) {
  const { scrollYProgress } = useScroll({
    target,
    offset: expressive ? ["start 80%", "start 15%"] : ["start 90%", "start 35%"],
  });

  useEffect(() => {
    const node = target.current;
    if (!node) return;
    const update = (value: number) => paintPortrait(node, value, expressive);
    // Direct anchor visits start at their visible position rather than hiding the image.
    const bounds = node.getBoundingClientRect();
    update(
      (innerHeight * (expressive ? 0.8 : 0.9) - bounds.top) /
        (innerHeight * (expressive ? 0.65 : 0.55)),
    );
    const unsubscribe = scrollYProgress.on("change", update);
    return () => {
      unsubscribe();
      for (const name of ["mask", "image-y", "image-scale"]) {
        node.style.removeProperty(`--portrait-${name}`);
      }
    };
  }, [expressive, scrollYProgress, target]);

  return null;
}

export function AboutPortraitMotion({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const target = useRef<HTMLDivElement>(null);
  const { mode } = useAnimationPolicy();
  const sequence = useAboutSequence();
  return (
    <div className={className}>
      <div ref={target} className={styles.reveal}>
        {mode !== "static" &&
          (sequence ? (
            <SequencePortrait target={target} />
          ) : (
            <PortraitScroll target={target} expressive={mode === "expressive"} />
          ))}
        {children}
      </div>
    </div>
  );
}
