"use client";

import { motion, type Variants } from "framer-motion";
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
  duration = 0.5,
  eager = true,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  duration?: number;
  /** Default starts ~200px early. Pass false for a visible, deliberate reveal (headings). */
  eager?: boolean;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={fadeUpVariants}
      initial="hidden"
      whileInView="visible"
      // Eager on purpose: the bottom margin starts the reveal ~200px early so content is
      // never perceived as stuck-invisible during a normal scroll.
      viewport={{
        once: true,
        amount: "some",
        margin: eager ? "0px 0px 200px 0px" : "0px 0px -40px 0px",
      }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
