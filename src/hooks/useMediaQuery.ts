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

/** The hero also animates on touch devices held in landscape. */
export const HERO_VIDEO_QUERY = `${BACKGROUND_VIDEO_QUERY}, (pointer: coarse) and (orientation: landscape)`;
