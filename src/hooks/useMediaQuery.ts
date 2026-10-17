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

/** Same breakpoint as Tailwind's `md:`, where the section videos start showing. */
export const DESKTOP_QUERY = "(min-width: 768px)";
