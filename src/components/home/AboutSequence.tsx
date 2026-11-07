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
import {
  PINNED_SCENE_QUERY,
  FOLD_VIEWPORT_QUERY,
  PORTRAIT_PHONE_QUERY,
  TOUCH_LANDSCAPE_QUERY,
  useMediaQuery,
} from "@/hooks/useMediaQuery";
import { phaseProgress } from "@/lib/scroll-phase";
import styles from "./about-sequence.module.css";

export const ABOUT_PIN_QUERY = PINNED_SCENE_QUERY;
/** Fold viewports share the lateral composition in either orientation. */
export const ABOUT_FOLD_QUERY = FOLD_VIEWPORT_QUERY;
/** Touch devices in landscape get the same pinned scene, minus the mouse-only effects. */
export const ABOUT_TOUCH_PIN_QUERY = `${TOUCH_LANDSCAPE_QUERY}, ${ABOUT_FOLD_QUERY}`;
/** Portrait phones use CSS-only motion, so no scroll script is mounted for them. */
export const ABOUT_PORTRAIT_QUERY = PORTRAIT_PHONE_QUERY;
/** Landscape phones flatten About into one compact grid in CSS, so nothing is pinned there. */
export const ABOUT_COMPACT_LANDSCAPE_QUERY =
  "(orientation: landscape) and (pointer: coarse) and (max-height: 500px)";
export { phaseProgress };

/** Pinned progress starts once the track reaches this much of the viewport, before it sticks. */
const PIN_START_PERCENT = 70;
/** Biography hand-off begins as the portrait settles, then fills the shortened pin. */
const EXIT_START = 0.58;

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
    offset: pinned
      ? [`start ${PIN_START_PERCENT}%`, `end ${stageBottom}px`]
      : ["start 80%", "end 60%"],
  });
  useEffect(() => {
    const node = target.current;
    if (!node) return;
    const update = (value: number) => progress.set(Math.max(0, Math.min(1, value)));
    const bounds = node.getBoundingClientRect();
    const startLine = (innerHeight * PIN_START_PERCENT) / 100;
    const endLine = stageBottom || startLine;
    update(
      pinned
        ? (startLine - bounds.top) / Math.max(1, bounds.height - endLine + startLine)
        : (innerHeight * 0.8 - bounds.top) / (bounds.height + innerHeight * 0.2),
    );
    if (pinned && !stageBottom) return;
    return scrollYProgress.on("change", update);
  }, [pinned, progress, scrollYProgress, stageBottom, target]);
  return null;
}

/** The portrait is settling: the composition recedes as the detailed biography rises. */
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
      const exit = phaseProgress(value, EXIT_START, 1);
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
      // Fold viewports land the content 40px lower, clear of the bar.
      // Touch landscape (iPad mini held wide) lands 50px higher so the results panel shows.
      const offset = window.matchMedia(FOLD_VIEWPORT_QUERY).matches
        ? 120
        : window.matchMedia(TOUCH_LANDSCAPE_QUERY).matches
          ? 40
          : 80;
      track.setAttribute("data-scroll-landing", String(offset - distance));
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
  const foldViewport = useMediaQuery(ABOUT_FOLD_QUERY);
  const portraitPhone = useMediaQuery(ABOUT_PORTRAIT_QUERY) && !foldViewport;
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
