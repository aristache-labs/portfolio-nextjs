"use client";

import { m } from "framer-motion";
import { useRef } from "react";
import {
  useProgressiveReveal,
  type ProgressiveRevealProps,
} from "@/components/motion/ProgressiveReveal";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useExperienceMobileReveal } from "./ExperienceMobileReveal";
import { SolidSkillEntrance } from "./SkillEntrance";
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
  const solidEntry =
    useMediaQuery(
      "(min-width: 1105px) and (max-width: 1140px) and (min-height: 1500px) and (max-height: 1850px) and (orientation: portrait)",
    ) && kind === "entry";
  const { controls } = useProgressiveReveal({
    ...options,
    element,
    enabled: !solidEntry && !hidden && !mobile && (kind !== "entry" || mode !== "expressive"),
  });
  useExperienceMobileReveal(element, mobile && !hidden);
  if (solidEntry && !hidden) {
    return (
      <div className={className}>
        <SolidSkillEntrance filtered={false}>{children}</SolidSkillEntrance>
      </div>
    );
  }
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
