/**
 * Every media query the motion layer branches on, in one place. Components and hooks
 * share these definitions. CSS modules mirror the Fold geometry to keep
 * layout and motion in agreement without changing ordinary portrait phones.
 */

/** Section background videos are reserved for desktop pointers. */
export const BACKGROUND_VIDEO_QUERY = "(min-width: 1024px) and (hover: hover) and (pointer: fine)";

/** Desktop scenes pin with native sticky scrolling only where there is room and a fine pointer. */
export const PINNED_SCENE_QUERY =
  "(min-width: 1024px) and (min-height: 700px) and (pointer: fine) and (hover: hover)";

/** Touch phones and tablets held sideways. */
export const TOUCH_LANDSCAPE_QUERY = "(orientation: landscape) and (pointer: coarse)";

/** Fold-sized viewports share their layout in either orientation. */
export const FOLD_VIEWPORT_QUERY =
  "(min-width: 680px) and (max-width: 1100px) and (min-height: 650px) and (min-aspect-ratio: 74/100) and (max-aspect-ratio: 5/4)";

/** Upright phones use mobile motion; Fold viewports retain their landscape scene. */
export const PORTRAIT_PHONE_QUERY = `(max-width: 767px) and (orientation: portrait) and (not (${FOLD_VIEWPORT_QUERY}))`;

/** Landscape layout and motion also apply to Fold viewports held upright. */
export const LANDSCAPE_LAYOUT_QUERY = `${TOUCH_LANDSCAPE_QUERY}, ${FOLD_VIEWPORT_QUERY}`;

/** The hero also animates on touch devices held in landscape. */
export const HERO_VIDEO_QUERY = `${BACKGROUND_VIDEO_QUERY}, ${TOUCH_LANDSCAPE_QUERY}`;

/** Portrait phones plus short touch landscape: the layouts that stack into one column. */
export const COMPACT_TOUCH_QUERY = `${PORTRAIT_PHONE_QUERY}, ${TOUCH_LANDSCAPE_QUERY} and (max-width: 1023px) and (max-height: 500px)`;

/** Short landscape windows, the `landscape-short:` Tailwind variant. */
export const LANDSCAPE_SHORT_QUERY = "(orientation: landscape) and (max-height: 500px)";
