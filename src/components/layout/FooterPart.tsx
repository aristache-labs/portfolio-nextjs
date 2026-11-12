"use client";

import { m } from "framer-motion";
import { useLayoutEffect, useRef } from "react";
import {
  useProgressiveReveal,
  type ProgressiveRevealProps,
} from "@/components/motion/ProgressiveReveal";
import { RevealSequence } from "@/components/motion/RevealSequence";
import mobileCss from "./footer-mobile-motion.module.css";

/** One stable part lets the timed, scroll and mobile drivers share the same content. */
export function FooterPart({
  scene,
  mobile,
  part,
  children,
  className,
  effect = "rise",
  duration = 1,
  delay,
  staggerChildren,
  entrance = false,
  entrancePart,
  ...options
}: ProgressiveRevealProps & {
  scene: boolean;
  mobile: boolean;
  part: string;
  /**
   * Opt out of all three drivers (timed, scroll scene, mobile): the footer plays one shared CSS
   * entrance for this part instead (footer-entrance.module.css, started by useEntranceOnce).
   */
  entrance?: boolean;
  /** Which entrance animation the wrapper itself takes, when it is the animated element. */
  entrancePart?: string;
}) {
  const element = useRef<HTMLDivElement>(null);
  const timed = !scene && !mobile && !entrance;
  const { controls, sequence, mode } = useProgressiveReveal({
    ...options,
    element,
    effect,
    duration,
    delay,
    enabled: timed,
  });
  useLayoutEffect(() => {
    if (timed) return;
    // Clear Motion's values, including inherited navigation variants, before CSS takes over.
    if (effect === "cascade") controls.set("visible");
    controls.set({ opacity: "", x: 0, y: 0, scale: 1, scaleX: 1 });
  });
  return (
    <m.div
      ref={element}
      data-part={scene && !mobile && !entrance ? part : undefined}
      data-footer-part={mobile && !entrance ? part : undefined}
      data-entrance-part={entrancePart}
      className={`${className ?? ""}${mobile && !entrance ? ` ${mobileCss.part}` : ""}`}
      initial={false}
      animate={controls}
      transformTemplate={timed ? undefined : () => ""}
      variants={
        effect === "cascade"
          ? {
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  duration: mode === "static" ? 0 : duration,
                  delay: mode === "static" ? 0 : (delay ?? 0.3),
                  staggerChildren:
                    mode === "static"
                      ? 0
                      : (staggerChildren ?? (mode === "expressive" ? 0.245 : 0)),
                  ease: [0.22, 1, 0.36, 1],
                },
              },
            }
          : undefined
      }
    >
      <RevealSequence.Provider
        value={timed && (effect === "cascade" || effect === "zoom") ? sequence : null}
      >
        {children}
      </RevealSequence.Provider>
    </m.div>
  );
}
