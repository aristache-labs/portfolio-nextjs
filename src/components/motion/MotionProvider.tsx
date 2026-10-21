"use client";

import type { ReactNode } from "react";
import { LazyMotion, domAnimation } from "framer-motion";

/**
 * Supplies the animation features for every `m.*` component below it. Components import `m`
 * instead of `motion`, so the full `motion` bundle is not pulled in.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}
