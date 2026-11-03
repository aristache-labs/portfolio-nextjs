"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { useMotionValue, useScroll, type MotionValue } from "framer-motion";
import { phaseProgress, smoothstep } from "@/lib/scroll-phase";
import styles from "./skills-sequence.module.css";

/** The scene runs from the section top at this share of the viewport up to the viewport top. */
const START = 0.9;

/** Furthest progress reached. Cards follow it, so they stay assembled when scrolling back up. */
const ScenePeak = createContext<MotionValue<number> | null>(null);
const CardEntry = createContext<MotionValue<number> | null>(null);
/** Entry progress of the surrounding card, only inside the desktop scroll scene. */
export const useSkillEntry = () => useContext(CardEntry);

function SceneDriver({
  section,
  peak,
}: {
  section: RefObject<HTMLElement | null>;
  peak: MotionValue<number>;
}) {
  const { scrollY } = useScroll();

  useEffect(() => {
    const node = section.current;
    if (!node) return;
    // The orbit lights up together with the cards and stays lit.
    const paint = () =>
      node.style.setProperty(
        "--skills-light",
        String(smoothstep(phaseProgress(peak.get(), 0.3, 1))),
      );
    const update = () => {
      const current = Math.max(
        0,
        Math.min(1, 1 - node.getBoundingClientRect().top / (START * innerHeight)),
      );
      if (current <= peak.get()) return;
      peak.set(current);
      paint();
    };
    paint();
    update();
    const unsubscribe = scrollY.on("change", update);
    window.addEventListener("resize", update);
    return () => {
      unsubscribe();
      window.removeEventListener("resize", update);
      node.style.removeProperty("--skills-light");
    };
  }, [peak, scrollY, section]);
  return null;
}

/** Assembles the desktop Skills scene from native scrolling, without pinning it. */
export function SkillsScene({
  section,
  enabled,
  children,
}: {
  section: RefObject<HTMLElement | null>;
  enabled: boolean;
  children: ReactNode;
}) {
  const peak = useMotionValue(0);
  return (
    <>
      {enabled && <SceneDriver section={section} peak={peak} />}
      <ScenePeak.Provider value={enabled ? peak : null}>{children}</ScenePeak.Provider>
    </>
  );
}

/** One card's place in the scene. Cards enter in turn and then stay. */
export function SkillSlot({ index, children }: { index: number; children: ReactNode }) {
  const progress = useContext(ScenePeak);
  const entry = useMotionValue(1);
  const slot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = slot.current;
    if (!node || !progress) return;
    const start = 0.4 + Math.min(index, 7) * 0.05;
    const update = (value: number) => {
      const current = smoothstep(phaseProgress(value, start, start + 0.25));
      entry.set(current);
      node.style.setProperty("--card-entry", String(current));
    };
    update(progress.get());
    const unsubscribe = progress.on("change", update);
    return () => {
      unsubscribe();
      node.style.removeProperty("--card-entry");
      entry.set(1);
    };
  }, [entry, index, progress]);

  return (
    <div ref={slot} className={styles.slot}>
      <CardEntry.Provider value={progress ? entry : null}>{children}</CardEntry.Provider>
    </div>
  );
}
