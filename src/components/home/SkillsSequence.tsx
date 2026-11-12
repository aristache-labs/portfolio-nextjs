"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { animate, useMotionValue, useScroll, type MotionValue } from "framer-motion";
import { useSectionNavigation } from "@/hooks/useSectionNavigation";
import {
  sectionNavigationPending,
  sectionTravelSkips,
  subscribeSectionNavigationComplete,
} from "@/lib/section-navigation";
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
  const navigation = useSectionNavigation(section, () => peak.get() === 0);

  useEffect(() => {
    const node = section.current;
    if (!node || navigation.pending) return;
    let entrance: ReturnType<typeof animate> | undefined;
    let entering = false;
    // The orbit lights up together with the cards and stays lit.
    const paint = () =>
      node.style.setProperty(
        "--skills-light",
        String(smoothstep(phaseProgress(peak.get(), 0.3, 1))),
      );
    // A section jump passed the scene before it assembled. Following the scroll mid-jump would
    // assemble it unseen, so it waits and plays timed on the first real visit.
    let skipped = false;
    const playTimed = () => {
      skipped = false;
      const destination = Math.max(
        0,
        Math.min(1, 1 - node.getBoundingClientRect().top / (START * innerHeight)),
      );
      entering = true;
      entrance = animate(peak.get(), destination, {
        duration: 1,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (value) => {
          peak.set(Math.max(peak.get(), value));
          paint();
        },
        onComplete: () => {
          entering = false;
        },
      });
    };
    const update = () => {
      if (sectionNavigationPending(node) || entering) return;
      if (sectionTravelSkips(node)) {
        if (peak.get() < 1) skipped = true;
        return;
      }
      if (skipped) {
        const bounds = node.getBoundingClientRect();
        // Above the screen it stays disassembled; on screen it assembles timed; below, by scroll.
        if (bounds.bottom <= 0) return;
        if (bounds.top < innerHeight) return playTimed();
        skipped = false;
      }
      const current = Math.max(
        0,
        Math.min(1, 1 - node.getBoundingClientRect().top / (START * innerHeight)),
      );
      if (current <= peak.get()) return;
      peak.set(current);
      paint();
    };
    paint();
    if (navigation.replay) playTimed();
    else update();
    const interrupt = () => {
      if (!entering) return;
      entering = false;
      entrance?.stop();
      update();
    };
    const onKey = (event: KeyboardEvent) => {
      if (
        ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ", "Escape"].includes(
          event.key,
        )
      )
        interrupt();
    };
    const unsubscribe = scrollY.on("change", update);
    const unsubscribeTravel = subscribeSectionNavigationComplete(update);
    window.addEventListener("wheel", interrupt, { passive: true });
    window.addEventListener("touchmove", interrupt, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", update);
    return () => {
      unsubscribe();
      unsubscribeTravel();
      entrance?.stop();
      window.removeEventListener("wheel", interrupt);
      window.removeEventListener("touchmove", interrupt);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", update);
      node.style.removeProperty("--skills-light");
    };
  }, [peak, scrollY, section, navigation.pending, navigation.replay]);
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
