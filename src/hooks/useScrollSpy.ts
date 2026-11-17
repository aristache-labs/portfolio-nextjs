"use client";

import { useEffect, useState } from "react";
import { subscribeScroll } from "@/lib/scroll-state";

/**
 * Active = the last section whose top has scrolled past `offsetPx`. A pure DOM read rather than
 * IntersectionObserver, so it is deterministic against a stubbed getBoundingClientRect.
 */
export function pickActive(ids: string[], tops: Record<string, number>, offsetPx: number): string {
  let active = ids[0] ?? "";
  for (const id of ids) {
    const top = tops[id];
    if (top === undefined) continue;
    if (top - offsetPx <= 0) active = id;
  }
  return active;
}

export function useScrollSpy(ids: string[], offsetPx = 120): string {
  const [active, setActive] = useState(ids[0] ?? "");

  useEffect(() => {
    if (ids.length === 0) return;

    const compute = () => {
      const tops: Record<string, number> = {};
      for (const id of ids) {
        const el = document.getElementById(id);
        // A section still streaming in sits in a hidden container: no box, and a top of 0 that
        // would read as "scrolled past" and mark the last such section active at the page top.
        if (el && el.getClientRects().length > 0) tops[id] = el.getBoundingClientRect().top;
      }
      setActive(pickActive(ids, tops, offsetPx));
    };

    compute();
    // Streamed sections appear after mount without any scroll event; the page grows when they do.
    const resize = new ResizeObserver(compute);
    resize.observe(document.body);
    const unsubscribe = subscribeScroll(compute);
    return () => {
      unsubscribe();
      resize.disconnect();
    };
  }, [ids, offsetPx]);

  return active;
}
