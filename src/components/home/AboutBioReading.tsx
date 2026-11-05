"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/** Match the static, expandable biography layout, including short landscape laptops. */
const COMPACT_BIO_QUERY =
  "(orientation: portrait) and (max-width: 767px), (orientation: landscape) and (max-width: 1024px) and (max-height: 500px)";

export function AboutBioReading({ children, className }: { children: ReactNode; className: string }) {
  const target = useRef<HTMLDivElement>(null);
  const { mode, ready } = useAnimationPolicy();
  const compact = useMediaQuery(COMPACT_BIO_QUERY);

  useEffect(() => {
    const node = target.current;
    if (!node || !ready || mode === "static" || compact) return;
    let disposed = false;
    let revert: (() => void) | undefined;

    // Keep GSAP in this section's lazy chunk; failed loading leaves the original text visible.
    void import("@/lib/gsap")
      .then(({ gsap }) => {
        if (disposed) return;
        const words = node.querySelectorAll("[data-bio-word]");
        if (!words.length) return;
        const context = gsap.context(() => {
          gsap.fromTo(
            words,
            { opacity: 0.65 },
            {
              opacity: 1,
              stagger: 0.04,
              duration: 0.16,
              ease: "none",
              scrollTrigger: {
                trigger: node,
                start: "top 85%",
                end: "bottom 65%",
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          );
        }, node);
        revert = () => context.revert();
      })
      .catch(() => {
        revert?.();
      });

    return () => {
      disposed = true;
      revert?.();
    };
  }, [compact, mode, ready, children]);

  return <div ref={target} className={className}>{children}</div>;
}
