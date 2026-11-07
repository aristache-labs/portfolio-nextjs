/**
 * Every media query the motion layer branches on, in one place. Hooks, GSAP `matchMedia`
 * conditions and the Tailwind custom variants in `globals.css` all mean the same thing by
 * these names, so a breakpoint is changed here and nowhere else.
 */

/** Section background videos are reserved for desktop pointers. */
export const BACKGROUND_VIDEO_QUERY = "(min-width: 1024px) and (hover: hover) and (pointer: fine)";

/** Desktop scenes pin with native sticky scrolling only where there is room and a fine pointer. */
export const PINNED_SCENE_QUERY =
  "(min-width: 1024px) and (min-height: 700px) and (pointer: fine) and (hover: hover)";

/** Phones held upright. Sections switch to their CSS-only mobile motion here. */
export const PORTRAIT_PHONE_QUERY = "(max-width: 767px) and (orientation: portrait)";

/** Touch phones and tablets held sideways. */
export const TOUCH_LANDSCAPE_QUERY = "(orientation: landscape) and (pointer: coarse)";

/** Fold-sized viewports share their layout in either orientation. */
export const FOLD_VIEWPORT_QUERY =
  "(min-width: 700px) and (max-width: 1023px) and (min-height: 650px) and (min-aspect-ratio: 4/5) and (max-aspect-ratio: 5/4)";

/** The hero also animates on touch devices held in landscape. */
export const HERO_VIDEO_QUERY = `${BACKGROUND_VIDEO_QUERY}, ${TOUCH_LANDSCAPE_QUERY}`;

/** Portrait phones plus short touch landscape: the layouts that stack into one column. */
export const COMPACT_TOUCH_QUERY = `${PORTRAIT_PHONE_QUERY}, ${TOUCH_LANDSCAPE_QUERY} and (max-width: 1023px) and (max-height: 500px)`;

/** Short landscape windows, the `landscape-short:` Tailwind variant. */
export const LANDSCAPE_SHORT_QUERY = "(orientation: landscape) and (max-height: 500px)";

/** Named conditions for `gsap.matchMedia()`. */
export const MOTION_CONDITIONS = {
  desktop: PINNED_SCENE_QUERY,
  portrait: PORTRAIT_PHONE_QUERY,
  landscapeShort: LANDSCAPE_SHORT_QUERY,
  reduced: "(prefers-reduced-motion: reduce)",
} as const;

export type MotionConditions = Record<keyof typeof MOTION_CONDITIONS, boolean>;
