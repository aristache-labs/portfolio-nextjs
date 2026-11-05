"use client";

import type { RefObject } from "react";
import { gsap, SplitText } from "@/lib/gsap";
import { useMotionMatch } from "./useMotionMatch";

type SplitRevealOptions = {
  by?: "chars" | "words" | "lines";
  stagger?: number;
  start?: string;
};

/**
 * Masked text reveal. SplitText keeps the original text readable by assistive tech (aria on
 * the parent), re-splits on resize and reverts with the context. The reveal plays once.
 */
export function useSplitReveal(
  scope: RefObject<HTMLElement | null>,
  selector: string,
  { by = "words", stagger = 0.04, start = "top 85%" }: SplitRevealOptions = {},
) {
  useMotionMatch(scope, () => {
    gsap.utils.toArray<HTMLElement>(selector, scope.current ?? undefined).forEach((element) => {
      SplitText.create(element, {
        type: by === "lines" ? "lines" : `lines,${by}`,
        mask: "lines",
        autoSplit: true,
        aria: "auto",
        onSplit: (split) =>
          gsap.from(split[by], {
            yPercent: 110,
            duration: 0.8,
            ease: "power4.out",
            stagger,
            scrollTrigger: { trigger: element, start, once: true },
          }),
      });
    });
  });
}
