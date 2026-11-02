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
import { PINNED_SCENE_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import { phaseProgress } from "@/lib/scroll-phase";
import styles from "./about-sequence.module.css";

export const ABOUT_PIN_QUERY = PINNED_SCENE_QUERY;
/** Touch devices in landscape get the same pinned scene, minus the mouse-only effects. */
export const ABOUT_TOUCH_PIN_QUERY = "(orientation: landscape) and (pointer: coarse)";
/** Portrait phones use CSS-only motion, so no scroll script is mounted for them. */
export const ABOUT_PORTRAIT_QUERY = "(max-width: 767px) and (orientation: portrait)";
/** Landscape phones flatten About into one compact grid in CSS, so nothing is pinned there. */
export const ABOUT_COMPACT_LANDSCAPE_QUERY =
  "(orientation: landscape) and (pointer: coarse) and (max-height: 500px)";
export { phaseProgress };

const Sequence = createContext<{
  progress: MotionValue<number>;
  expressive: boolean;
  pinned: boolean;
} | null>(null);
export const useAboutSequence = () => useContext(Sequence);

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

/** Second half of the pinned scene: the composition recedes as the detailed biography rises. */
function PinnedExit({
  target,
  details,
  progress,
}: {
  target: RefObject<HTMLDivElement | null>;
  details: RefObject<HTMLDivElement | null>;
  progress: MotionValue<number>;
}) {
  useEffect(() => {
    const stage = target.current?.firstElementChild;
    if (!(stage instanceof HTMLElement)) return;
    const nodes = details.current ? [stage, details.current] : [stage];
    const update = (value: number) => {
      const exit = phaseProgress(value, 0.55, 1);
      for (const node of nodes)
        node.style.setProperty("--about-exit", String(exit * exit * (3 - 2 * exit)));
    };
    update(progress.get());
    const unsubscribe = progress.on("change", update);
    return () => {
      unsubscribe();
      for (const node of nodes) node.style.removeProperty("--about-exit");
    };
  }, [details, progress, target]);
  return null;
}

/** Marks which CSS column each biography paragraph landed in, so columns enter in turn. */
function BiographyColumns({ details }: { details: RefObject<HTMLDivElement | null> }) {
  useEffect(() => {
    const node = details.current;
    if (!node) return;
    const measure = () => {
      const paragraphs = [...node.querySelectorAll("p")].filter((p) => p.offsetParent);
      const first = Math.min(...paragraphs.map((p) => p.getBoundingClientRect().left));
      for (const p of paragraphs)
        p.style.setProperty(
          "--column-index",
          p.getBoundingClientRect().left > first + 1 ? "1" : "0",
        );
    };
    measure();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    observer?.observe(node);
    return () => {
      observer?.disconnect();
      for (const p of node.querySelectorAll("p")) p.style.removeProperty("--column-index");
    };
  }, [details]);
  return null;
}

/** Menu and hash navigation land at the end of the pin, with the biography right below. */
function ScrollLanding({ target }: { target: RefObject<HTMLDivElement | null> }) {
  useEffect(() => {
    const track = target.current;
    const stage = track?.firstElementChild;
    if (!track || !stage) return;
    const measure = () => {
      const distance = Math.max(0, track.offsetHeight - stage.getBoundingClientRect().height);
      track.setAttribute("data-scroll-landing", String(80 - distance));
    };
    measure();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    observer?.observe(track);
    observer?.observe(stage);
    return () => {
      observer?.disconnect();
      track.removeAttribute("data-scroll-landing");
    };
  }, [target]);
  return null;
}

export function AboutSequence({ children, details }: { children: ReactNode; details?: ReactNode }) {
  const target = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const progress = useMotionValue(0);
  const { mode } = useAnimationPolicy();
  const desktopPinned = useMediaQuery(ABOUT_PIN_QUERY) && mode === "expressive";
  const touchPinned = useMediaQuery(ABOUT_TOUCH_PIN_QUERY) && mode !== "static";
  const portraitPhone = useMediaQuery(ABOUT_PORTRAIT_QUERY);
  const compactLandscape = useMediaQuery(ABOUT_COMPACT_LANDSCAPE_QUERY);
  const compactPhone = portraitPhone || compactLandscape;
  const pinned = desktopPinned || (touchPinned && !compactPhone);
  return (
    <>
      <div ref={target} className={styles.track}>
        {mode !== "static" && !compactPhone && (
          <ScrollDriver target={target} progress={progress} pinned={pinned} />
        )}
        {pinned && <PinnedExit target={target} details={detailsRef} progress={progress} />}
        {pinned && <ScrollLanding target={target} />}
        {pinned && <BiographyColumns details={detailsRef} />}
        <Sequence.Provider
          value={
            mode === "static" || compactPhone
              ? null
              : { progress, expressive: mode === "expressive" || pinned, pinned }
          }
        >
          <div className={styles.stage}>{children}</div>
        </Sequence.Provider>
      </div>
      {details && (
        <div ref={detailsRef} className={styles.details}>
          {details}
        </div>
      )}
    </>
  );
}
