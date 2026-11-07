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

export {
  BACKGROUND_VIDEO_QUERY,
  FOLD_VIEWPORT_QUERY,
  LANDSCAPE_LAYOUT_QUERY,
  COMPACT_TOUCH_QUERY,
  HERO_VIDEO_QUERY,
  PINNED_SCENE_QUERY,
  PORTRAIT_PHONE_QUERY,
  TOUCH_LANDSCAPE_QUERY,
} from "@/lib/motion-queries";
