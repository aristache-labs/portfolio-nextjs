/**
 * How far into the screen an element must come before its timed entrance starts, as a share of the
 * viewport height. An entrance that starts the moment an element touches the bottom edge is half
 * over before the visitor looks at it, so it waits until the element is properly in front.
 * Scroll-linked scenes are not timed and do not use this.
 */
export const REVEAL_DEPTH = 0.25;
/** Phones show fewer, larger blocks at a time, so the same wait is shorter there. */
export const MOBILE_REVEAL_DEPTH = 0.13;

// Reading innerHeight with dirty styles forces a synchronous style recalc, and every entrance hook
// calls this during the same mount. Read it once and refresh on resize (orientation and the mobile
// URL bar both fire it).
let viewportHeight: number | null = null;
if (typeof window !== "undefined") {
  window.addEventListener(
    "resize",
    () => {
      viewportHeight = null;
    },
    { passive: true },
  );
}

export const revealInset = (share: number) =>
  Math.round((viewportHeight ??= window.innerHeight) * share);
