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
        if (el) tops[id] = el.getBoundingClientRect().top;
      }
      setActive(pickActive(ids, tops, offsetPx));
    };

    compute();
    return subscribeScroll(compute);
  }, [ids, offsetPx]);

  return active;
}
