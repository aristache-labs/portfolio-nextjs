"use client";

import { m, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export function Reveal({
  children,
  delay = 0,
  className,
  distance = 24,
  duration = 0.5,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  distance?: number;
  duration?: number;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      className={className}
      variants={{ hidden: { opacity: 0, y: distance }, visible: { opacity: 1, y: 0 } }}
      initial="hidden"
      whileInView="visible"
      // Eager on purpose: the bottom margin starts the reveal ~200px early so content is
      // never perceived as stuck-invisible during a normal scroll.
      viewport={{ once: true, amount: "some", margin: "0px 0px 200px 0px" }}
      transition={{ duration, delay, ease: "easeOut" }}
    >
      {children}
    </m.div>
  );
}
