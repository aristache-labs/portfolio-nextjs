"use client";

import { useRef, type ReactNode } from "react";
import { m, type Variants } from "framer-motion";
import { useProgressiveReveal } from "@/components/motion/ProgressiveReveal";
import { RevealSequence } from "@/components/motion/RevealSequence";
import { ProjectsArrival } from "./ProjectsArrival";

export function ProjectsGrid({
  enabled,
  className,
  children,
}: {
  enabled: boolean;
  className: string;
  children: ReactNode;
}) {
  const element = useRef<HTMLDivElement>(null);
  const { controls, sequence } = useProgressiveReveal({
    element,
    enabled,
    effect: "cascade",
    duration: 0,
    delay: 0,
    viewportInset: 0,
  });
  return (
    <m.div
      ref={element}
      data-projects-grid=""
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
                  duration: 0,
                  delay: 0,
                  staggerChildren: 0.1,
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

export function ProjectsGridCard({
  mobile,
  scene,
  interacted,
  staticMotion,
  order,
  variants,
  children,
}: {
  mobile: boolean;
  scene: boolean;
  interacted: boolean;
  staticMotion: boolean;
  order: number;
  variants: Variants;
  children: ReactNode;
}) {
  return (
    <m.div
      data-project-grid-card=""
      className="h-full"
      initial={!mobile && interacted && !staticMotion ? "hidden" : false}
      animate={
        mobile
          ? { opacity: 1, scale: 1 }
          : interacted
            ? "visible"
            : scene
              ? { opacity: 1, scale: 1 }
              : undefined
      }
      transition={mobile || (scene && !interacted) ? { duration: 0 } : undefined}
      variants={variants}
    >
      <ProjectsArrival
        plain
        kind="card"
        order={order % 2}
        className="h-full"
        scrollFrom={scene ? "below" : undefined}
        scrollLag={(order % 3) * 0.05}
      >
        {children}
      </ProjectsArrival>
    </m.div>
  );
}
