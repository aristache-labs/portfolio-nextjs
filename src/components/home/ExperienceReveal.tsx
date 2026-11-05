"use client";

import { m } from "framer-motion";
import { useRef } from "react";
import {
  useProgressiveReveal,
  type ProgressiveRevealProps,
} from "@/components/motion/ProgressiveReveal";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { useExperienceMobileReveal } from "./ExperienceMobileReveal";
import styles from "./experience-layout.module.css";

/** Keep the timeline content mounted while mobile CSS, the rail or Motion owns its entrance. */
export function ExperienceReveal({
  mobile,
  kind,
  hidden = false,
  children,
  className,
  ...options
}: ProgressiveRevealProps & {
  mobile: boolean;
  kind: "title" | "description" | "entry";
  hidden?: boolean;
}) {
  const element = useRef<HTMLDivElement>(null);
  const { mode } = useAnimationPolicy();
  const { controls } = useProgressiveReveal({
    ...options,
    element,
    enabled: !hidden && !mobile && (kind !== "entry" || mode !== "expressive"),
  });
  useExperienceMobileReveal(element, mobile && !hidden);
  return (
    <m.div
      ref={element}
      className={`${mobile ? styles.mobileReveal : ""} ${className ?? ""}`}
      data-experience-reveal={mobile ? kind : undefined}
      hidden={hidden}
      style={hidden ? { display: "none" } : undefined}
      initial={false}
      animate={controls}
    >
      {children}
    </m.div>
  );
}
