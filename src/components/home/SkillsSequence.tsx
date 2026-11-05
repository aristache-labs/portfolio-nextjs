"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { animate, useMotionValue, type MotionValue } from "framer-motion";
import { useSectionNavigation } from "@/hooks/useSectionNavigation";
import { sectionNavigationPending } from "@/lib/section-navigation";
import { phaseProgress, smoothstep } from "@/lib/scroll-phase";
import styles from "./skills-sequence.module.css";

/** The scene runs from the section top at this share of the viewport up to the viewport top. */
const START = "top 90%";

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
  const navigation = useSectionNavigation(section, () => peak.get() === 0);

  useEffect(() => {
    const node = section.current;
    if (!node || navigation.pending) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    const paint = () =>
      node.style.setProperty(
        "--skills-light",
        String(smoothstep(phaseProgress(peak.get(), 0.3, 1))),
      );
    paint();
    void import("@/lib/gsap")
      .then(({ ScrollTrigger }) => {
        if (disposed) return;
        let entrance: ReturnType<typeof animate> | undefined;
        let entering = false;
        const update = (current: number) => {
          if (sectionNavigationPending(node) || entering || current <= peak.get()) return;
          peak.set(Math.max(peak.get(), current));
          paint();
        };
        const trigger = ScrollTrigger.create({
          trigger: node,
          start: START,
          end: "top top",
          onUpdate: (self) => update(self.progress),
        });
        if (navigation.replay) {
          entering = true;
          entrance = animate(peak.get(), Math.max(peak.get(), trigger.progress), {
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
        } else update(trigger.progress);
        const interrupt = () => {
          if (!entering) return;
          entering = false;
          entrance?.stop();
          update(trigger.progress);
        };
        const onKey = (event: KeyboardEvent) => {
          if (
            ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ", "Escape"].includes(
              event.key,
            )
          )
            interrupt();
        };
        window.addEventListener("wheel", interrupt, { passive: true });
        window.addEventListener("touchmove", interrupt, { passive: true });
        window.addEventListener("keydown", onKey);
        cleanup = () => {
          trigger.kill();
          entrance?.stop();
          window.removeEventListener("wheel", interrupt);
          window.removeEventListener("touchmove", interrupt);
          window.removeEventListener("keydown", onKey);
        };
      })
      .catch(() => {
        if (!disposed) {
          peak.set(1);
          paint();
        }
      });
    return () => {
      disposed = true;
      cleanup?.();
      node.style.removeProperty("--skills-light");
    };
  }, [peak, section, navigation.pending, navigation.replay]);
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
