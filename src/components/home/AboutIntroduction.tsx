"use client";

import { useEffect, useRef, type CSSProperties, type RefObject } from "react";
import { useScroll } from "framer-motion";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import styles from "./about-introduction.module.css";
import { phaseProgress, useAboutSequence } from "./AboutSequence";

function SequenceReading({ target }: { target: RefObject<HTMLParagraphElement | null> }) {
  const sequence = useAboutSequence();
  useEffect(() => {
    const node = target.current;
    if (!node || !sequence) return;
    const update = (value: number) =>
      node.style.setProperty(
        "--intro-progress",
        String(phaseProgress(value, 0, sequence.expressive ? 0.34 : 0.22)),
      );
    update(sequence.progress.get());
    const unsubscribe = sequence.progress.on("change", update);
    return () => {
      unsubscribe();
      node.style.removeProperty("--intro-progress");
    };
  }, [sequence, target]);
  return null;
}

function ReadingProgress({ target }: { target: RefObject<HTMLParagraphElement | null> }) {
  const { scrollYProgress } = useScroll({
    target,
    offset: ["start 80%", "end 40%"],
  });
  useEffect(() => {
    const node = target.current;
    if (!node) return;
    const update = (value: number) => {
      node.style.setProperty("--intro-progress", String(Math.max(0, Math.min(1, value))));
    };
    const bounds = node.getBoundingClientRect();
    update((innerHeight * 0.8 - bounds.top) / (bounds.height + innerHeight * 0.4));
    const unsubscribe = scrollYProgress.on("change", update);
    return () => {
      unsubscribe();
      node.style.removeProperty("--intro-progress");
    };
  }, [scrollYProgress, target]);
  return null;
}

export function AboutIntroduction({ text }: { text: string }) {
  const target = useRef<HTMLParagraphElement>(null);
  const { mode } = useAnimationPolicy();
  const sequence = useAboutSequence();
  const words = text.trim().split(/\s+/).filter(Boolean);
  return (
    <p
      ref={target}
      className={styles.introduction}
      style={{ "--word-count": words.length } as CSSProperties}
    >
      {mode !== "static" &&
        (sequence ? <SequenceReading target={target} /> : <ReadingProgress target={target} />)}
      {words.map((word, index) => (
        <span
          key={index}
          className={styles.word}
          style={{ "--word-index": index } as CSSProperties}
        >
          {word}
          {index < words.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}
