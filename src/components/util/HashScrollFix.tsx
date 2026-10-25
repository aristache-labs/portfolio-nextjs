"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { sectionScrollPosition } from "@/lib/scroll-to-section";

/** Position cross-page anchors without animating through the whole homepage. */
export function HashScrollFix() {
  const pathname = usePathname();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    let id: string;
    try {
      id = decodeURIComponent(hash.slice(1));
    } catch {
      return;
    }

    let lastPosition: number | undefined;
    let attempts = 0;
    const tick = () => {
      const target = document.getElementById(id);
      if (target) {
        const position = sectionScrollPosition(target);
        if (lastPosition === undefined || Math.abs(position - lastPosition) > 2) {
          window.scrollTo({ top: position, behavior: "instant" });
          lastPosition = position;
        }
      }
      if (++attempts >= 20) clearInterval(timer);
    };

    const timer = setInterval(tick, 100);
    const stop = () => clearInterval(timer);
    const onKey = (event: KeyboardEvent) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key))
        stop();
    };
    tick();
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchmove", stop, { passive: true });
    window.addEventListener("pointerdown", stop, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      stop();
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchmove", stop);
      window.removeEventListener("pointerdown", stop);
      window.removeEventListener("keydown", onKey);
    };
  }, [pathname]);

  return null;
}
