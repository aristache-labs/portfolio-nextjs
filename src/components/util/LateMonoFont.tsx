"use client";

import { useEffect } from "react";

const FAMILY = "Geist Mono";
const SRC = "url(/fonts/GeistMono-Variable.woff2) format('woff2')";

/**
 * Geist Mono only styles small labels, yet as a regular @font-face it was fetched at top priority
 * on the first screen, competing with the mobile LCP poster on slow connections. Load it once the
 * page has finished loading; until then the labels use the system monospace fallback in
 * --font-geist-mono, then swap.
 */
export function LateMonoFont() {
  useEffect(() => {
    if (typeof FontFace === "undefined") return;
    let cancelled = false;
    let cancelScheduled: (() => void) | undefined;

    const load = () => {
      const font = new FontFace(FAMILY, SRC, {
        weight: "100 900",
        style: "normal",
        display: "swap",
      });
      font
        .load()
        .then((loaded) => {
          if (!cancelled) document.fonts.add(loaded);
        })
        .catch(() => {
          // The fallback stack already renders the labels; nothing to recover.
        });
    };
    const schedule = () => {
      if (typeof window.requestIdleCallback === "function") {
        const id = window.requestIdleCallback(load, { timeout: 2000 });
        cancelScheduled = () => window.cancelIdleCallback(id);
      } else {
        const id = setTimeout(load, 0);
        cancelScheduled = () => clearTimeout(id);
      }
    };

    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
      cancelScheduled?.();
    };
  }, []);

  return null;
}
