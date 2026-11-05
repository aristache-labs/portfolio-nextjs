"use client";

import type { RefObject } from "react";
import { gsap } from "@/lib/gsap";
import { parseCountText } from "@/lib/count-text";
import { useMotionMatch } from "./useMotionMatch";

/**
 * Counts from 0 to the number already in the HTML. The final value is the server-rendered text,
 * so crawlers, reduced motion and a failed script all see the right figure; only a visible,
 * motion-enabled visit watches it climb.
 */
export function useCountUp(scope: RefObject<HTMLElement | null>, selector: string) {
  useMotionMatch(scope, () => {
    const restore: Array<() => void> = [];
    gsap.utils.toArray<HTMLElement>(selector, scope.current ?? undefined).forEach((element) => {
      const finalText = element.textContent ?? "";
      const parsed = parseCountText(finalText);
      if (!parsed) return;
      restore.push(() => {
        element.textContent = finalText;
      });
      const state = { value: 0 };
      const render = () => {
        const shown = state.value.toLocaleString("en-US", {
          useGrouping: parsed.grouped,
          minimumFractionDigits: parsed.decimals,
          maximumFractionDigits: parsed.decimals,
        });
        element.textContent = `${parsed.prefix}${shown}${parsed.suffix}`;
      };
      render();
      gsap.to(state, {
        value: parsed.value,
        duration: 1.6,
        ease: "power2.out",
        onUpdate: render,
        onComplete: () => {
          element.textContent = finalText;
        },
        scrollTrigger: { trigger: element, start: "top 90%", once: true },
      });
    });
    // A revert mid-count must put the server-rendered figure back.
    return () => restore.forEach((fn) => fn());
  });
}
