"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { useMotionValue, useScroll, type MotionValue } from "framer-motion";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import styles from "./about-sequence.module.css";

export const ABOUT_PIN_QUERY =
  "(min-width: 1024px) and (min-height: 700px) and (pointer: fine) and (hover: hover)";

const Sequence = createContext<{
  progress: MotionValue<number>;
  expressive: boolean;
  pinned: boolean;
} | null>(null);
export const useAboutSequence = () => useContext(Sequence);
export const phaseProgress = (value: number, start: number, end: number) =>
  Math.max(0, Math.min(1, (value - start) / (end - start)));

function ScrollDriver({
  target,
  progress,
  pinned,
}: {
  target: RefObject<HTMLDivElement | null>;
  progress: MotionValue<number>;
  pinned: boolean;
}) {
  const [stageBottom, setStageBottom] = useState(0);
  useEffect(() => {
    const stage = target.current?.firstElementChild;
    if (!stage || !pinned) return;
    const measure = () => setStageBottom(stage.getBoundingClientRect().height + 80);
    measure();
    if (typeof ResizeObserver !== "function") return;
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [pinned, target]);
  const { scrollYProgress } = useScroll({
    target,
    offset: pinned ? ["start 80px", `end ${stageBottom}px`] : ["start 80%", "end 60%"],
  });
  useEffect(() => {
    const node = target.current;
    if (!node) return;
    const update = (value: number) => progress.set(Math.max(0, Math.min(1, value)));
    const bounds = node.getBoundingClientRect();
    update(
      pinned
        ? (80 - bounds.top) / Math.max(1, bounds.height - (stageBottom || 80) + 80)
        : (innerHeight * 0.8 - bounds.top) / (bounds.height + innerHeight * 0.2),
    );
    if (pinned && !stageBottom) return;
    return scrollYProgress.on("change", update);
  }, [pinned, progress, scrollYProgress, stageBottom, target]);
  return null;
}

export function AboutSequence({ children, details }: { children: ReactNode; details?: ReactNode }) {
  const target = useRef<HTMLDivElement>(null);
  const progress = useMotionValue(0);
  const { mode } = useAnimationPolicy();
  const pinned = useMediaQuery(ABOUT_PIN_QUERY) && mode === "expressive";
  return (
    <>
      <div ref={target} className={styles.track}>
        {mode !== "static" && <ScrollDriver target={target} progress={progress} pinned={pinned} />}
        <Sequence.Provider
          value={mode === "static" ? null : { progress, expressive: mode === "expressive", pinned }}
        >
          <div className={styles.stage}>{children}</div>
        </Sequence.Provider>
      </div>
      {details && <div className={styles.details}>{details}</div>}
    </>
  );
}
