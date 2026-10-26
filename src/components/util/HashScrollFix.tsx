"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { sectionScrollPosition } from "@/lib/scroll-to-section";

/** Position cross-page anchors without animating through the whole homepage. */
export function HashScrollFix() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const initialDocument = useRef(true);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      initialDocument.current = false;
      previousPathname.current = pathname;
    }
    const navigation = performance.getEntriesByType?.("navigation")[0] as
      PerformanceNavigationTiming | undefined;
    // A reload restores the reader's position, which can differ from the URL's old hash.
    // Cross-page anchor navigation still uses the alignment below.
    if (initialDocument.current && navigation?.type === "reload") return;
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    let id: string;
    try {
      id = decodeURIComponent(hash.slice(1));
    } catch {
      return;
    }

    let attempts = 0;
    let settledAttempts = 0;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const tick = () => {
      if (cancelled) return;
      if (window.location.hash !== hash) {
        stop();
        return;
      }
      const target = document.getElementById(id);
      // Streamed content may be missing or still inside a hidden React boundary.
      if (target && target.getClientRects().length > 0) {
        const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const position = Math.max(0, Math.min(sectionScrollPosition(target), maximum));
        // Restoration and reveal layout work can move the viewport even when the
        // section's document position has not changed. Compare the actual scroll.
        if (Math.abs(window.scrollY - position) > 2) {
          window.scrollTo({ top: position, behavior: "instant" });
        }
        settledAttempts += 1;
      }
      // Two seconds after content appears, with a bounded wait for slow streamed pages.
      if (++attempts >= 100 || settledAttempts >= 20) clearInterval(timer);
    };

    const restart = () => {
      if (cancelled || window.location.hash !== hash) return;
      clearInterval(timer);
      attempts = 0;
      settledAttempts = 0;
      timer = setInterval(tick, 100);
      tick();
    };
    const stop = () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("load", restart);
      window.removeEventListener("pageshow", restart);
      window.removeEventListener("hashchange", stop);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchmove", stop);
      window.removeEventListener("pointerdown", stop);
      window.removeEventListener("keydown", onKey);
      document.fonts?.removeEventListener("loadingdone", restart);
    };
    const onKey = (event: KeyboardEvent) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key))
        stop();
    };
    window.addEventListener("load", restart);
    window.addEventListener("pageshow", restart);
    window.addEventListener("hashchange", stop);
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchmove", stop, { passive: true });
    window.addEventListener("pointerdown", stop, { passive: true });
    window.addEventListener("keydown", onKey);
    document.fonts?.addEventListener("loadingdone", restart);
    void document.fonts?.ready.then(restart);
    restart();
    return stop;
  }, [pathname]);

  return null;
}
