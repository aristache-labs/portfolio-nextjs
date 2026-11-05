"use client";

import { m } from "framer-motion";
import { useRef, type RefObject } from "react";
import {
  useProgressiveReveal,
  type ProgressiveRevealProps,
} from "@/components/motion/ProgressiveReveal";
import { RevealSequence } from "@/components/motion/RevealSequence";
import { useSkillsMobileReveal } from "./SkillsMobileReveal";
import styles from "./skills-mobile-motion.module.css";

/** Retain the content and its Motion identity while only the entrance driver changes. */
export function SkillsReveal({
  mobile,
  kind,
  children,
  className,
  ...options
}: ProgressiveRevealProps & {
  mobile: boolean;
  kind: "title" | "description" | "quote";
}) {
  const element = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const fromRight = options.effect === "fade-from-right";

  const { controls } = useProgressiveReveal({ ...options, element, enabled: !mobile });
  useSkillsMobileReveal(fromRight ? inner : element, mobile);
  const mobileClass = mobile ? styles.reveal : "";

  if (fromRight) {
    return (
      <div ref={element} className={className}>
        <m.div
          ref={inner}
          className={`w-full min-w-0 ${mobileClass}`}
          data-kind={mobile ? kind : undefined}
          initial={false}
          animate={controls}
        >
          {children}
        </m.div>
      </div>
    );
  }

  return (
    <m.div
      ref={element}
      className={`${className ?? ""} ${mobileClass}`}
      data-kind={mobile ? kind : undefined}
      initial={false}
      animate={controls}
    >
      {children}
    </m.div>
  );
}

/** The scene, mobile cards and fallback cascade share one grid and one provider position. */
export function SkillsGridReveal({
  enabled,
  gridRef,
  children,
  className,
}: Pick<ProgressiveRevealProps, "children" | "className"> & {
  enabled: boolean;
  gridRef: RefObject<HTMLDivElement | null>;
}) {
  const { controls, sequence, mode } = useProgressiveReveal({
    element: gridRef,
    enabled,
    effect: "cascade",
    duration: 1.3,
    delay: 0.4,
  });
  return (
    <m.div
      ref={gridRef}
      className={className}
      initial={false}
      animate={controls}
      variants={
        enabled
          ? {
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  duration: mode === "static" ? 0 : 1.3,
                  delay: mode === "static" ? 0 : 0.4,
                  staggerChildren: mode === "static" ? 0 : 0.18,
                  ease: [0.22, 1, 0.36, 1],
                },
              },
            }
          : undefined
      }
    >
      <RevealSequence.Provider value={enabled ? sequence : null}>
        {children}
      </RevealSequence.Provider>
    </m.div>
  );
}
