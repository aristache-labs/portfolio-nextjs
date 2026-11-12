/**
 * How far into the screen an element must come before its timed entrance starts, as a share of the
 * viewport height. An entrance that starts the moment an element touches the bottom edge is half
 * over before the visitor looks at it, so it waits until the element is properly in front.
 * Scroll-linked scenes are not timed and do not use this.
 */
export const REVEAL_DEPTH = 0.25;
/** Phones show fewer, larger blocks at a time, so the same wait is shorter there. */
export const MOBILE_REVEAL_DEPTH = 0.13;

export const revealInset = (share: number) => Math.round(window.innerHeight * share);
