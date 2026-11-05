import { useSyncExternalStore } from "react";

/**
 * Tracks a media query. The server snapshot is always false so the first client render
 * matches the HTML; the real value arrives right after hydration.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (!window.matchMedia) return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => Boolean(window.matchMedia?.(query).matches),
    () => false,
  );
}

/** Section background videos are reserved for desktop pointers. */
export const BACKGROUND_VIDEO_QUERY = "(min-width: 1024px) and (hover: hover) and (pointer: fine)";

/** Desktop scenes pin with native sticky scrolling only where there is room and a fine pointer. */
export const PINNED_SCENE_QUERY =
  "(min-width: 1024px) and (min-height: 700px) and (pointer: fine) and (hover: hover)";

/** The hero also animates on touch devices held in landscape. */
export const HERO_VIDEO_QUERY = `${BACKGROUND_VIDEO_QUERY}, (pointer: coarse) and (orientation: landscape)`;

/** Phones held upright. Sections switch to their CSS-only mobile motion here. */
export const PORTRAIT_PHONE_QUERY = "(max-width: 767px) and (orientation: portrait)";

/** Touch phones and tablets held sideways. */
export const TOUCH_LANDSCAPE_QUERY = "(orientation: landscape) and (pointer: coarse)";

/** Portrait phones plus short touch landscape: the layouts that stack into one column. */
export const COMPACT_TOUCH_QUERY = `${PORTRAIT_PHONE_QUERY}, ${TOUCH_LANDSCAPE_QUERY} and (max-width: 1023px) and (max-height: 500px)`;
