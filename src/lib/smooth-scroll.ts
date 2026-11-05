import type Lenis from "lenis";

/**
 * The one smooth-scroll instance, owned by `SmoothScroll`. Lenis runs only for expressive
 * desktop pointers, so every caller must handle `null` and fall back to native scrolling.
 */
let instance: Lenis | null = null;
const listeners = new Set<(lenis: Lenis | null) => void>();

export function getSmoothScroll(): Lenis | null {
  return instance;
}

export function setSmoothScroll(lenis: Lenis | null) {
  instance = lenis;
  listeners.forEach((listener) => listener(lenis));
}

/** Runs now with the current instance and again whenever it is created or destroyed. */
export function onSmoothScrollChange(listener: (lenis: Lenis | null) => void): () => void {
  listeners.add(listener);
  listener(instance);
  return () => listeners.delete(listener);
}
