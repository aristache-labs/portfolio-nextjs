import type Lenis from "lenis";

/**
 * The one smooth-scroll instance, owned by `SmoothScroll`. Lenis runs only for expressive
 * desktop pointers, so every caller must handle `null` and fall back to native scrolling.
 */
let instance: Lenis | null = null;

export function getSmoothScroll(): Lenis | null {
  return instance;
}

export function setSmoothScroll(lenis: Lenis | null) {
  instance = lenis;
}
