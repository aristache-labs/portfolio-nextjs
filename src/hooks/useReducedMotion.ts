import { useSyncExternalStore } from "react";
import type { MotionProps } from "framer-motion";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

/**
 * Tracks `prefers-reduced-motion`. The server snapshot is always false so the
 * first client render matches the HTML. Reading matchMedia in the initial
 * state diverges as soon as the browser prefers reduced motion (the screenshot
 * script sets that), and React throws a hydration mismatch.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

// Explicit targets also clear hidden styles left by the server render during hydration.
export const REDUCED_MOTION_PROPS: MotionProps = {
  initial: false,
  animate: { opacity: 1, x: 0, y: 0, scale: 1 },
  exit: { opacity: 1 },
  transition: { duration: 0 },
  whileHover: undefined,
  whileTap: undefined,
};

export function useReducedMotionProps(): MotionProps {
  return useReducedMotion() ? REDUCED_MOTION_PROPS : {};
}
