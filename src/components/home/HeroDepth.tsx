"use client";

import { useEffect, type RefObject } from "react";
import { useMotionValue, useSpring } from "framer-motion";

/**
 * Desktop pointer depth: the picture drifts against the cursor and the copy tilts toward it.
 * Values run from -0.5 to 0.5 and reach CSS as custom properties, so nothing re-renders.
 * Mounted only for expressive motion; touch and reduced motion never create the springs.
 */
export function HeroDepth({ section }: { section: RefObject<HTMLElement | null> }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 60, damping: 22, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 60, damping: 22, mass: 0.6 });

  useEffect(() => {
    const node = section.current;
    if (!node) return;
    const write = () => {
      node.style.setProperty("--hero-pointer-x", String(springX.get()));
      node.style.setProperty("--hero-pointer-y", String(springY.get()));
    };
    // Normalising against the viewport keeps this listener free of layout reads.
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x.set(event.clientX / window.innerWidth - 0.5);
      y.set(event.clientY / window.innerHeight - 0.5);
    };
    const reset = () => {
      x.set(0);
      y.set(0);
    };
    const unsubscribeX = springX.on("change", write);
    const unsubscribeY = springY.on("change", write);
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerleave", reset);
    return () => {
      unsubscribeX();
      unsubscribeY();
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerleave", reset);
      node.style.removeProperty("--hero-pointer-x");
      node.style.removeProperty("--hero-pointer-y");
    };
  }, [springX, springY, x, y, section]);

  return null;
}
