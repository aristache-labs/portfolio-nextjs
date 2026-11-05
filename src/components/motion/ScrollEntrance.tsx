"use client";

import { useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";
import { animate, useScroll } from "framer-motion";
import { useSectionNavigation } from "@/hooks/useSectionNavigation";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { phaseProgress, smoothstep } from "@/lib/scroll-phase";
import styles from "./scroll-entrance.module.css";

/** The element starts entering when its top reaches this share of the viewport... */
const START = 0.95;
/** ...and has fully entered this share of the viewport later. */
const SPAN = 0.35;

/**
 * Scroll-driven entrance measured from the element's own position, so stacked and side by side
 * items arrive as they come into view. One way: once entered, it stays when scrolling back up.
 * Without `enabled` it renders a plain wrapper and never hides anything.
 * The wrapper moves while its direct child fades, so pass a glass card as that child.
 */
export function ScrollEntrance({
  enabled,
  from,
  lag = 0,
  className,
  children,
}: {
  enabled: boolean;
  from: "left" | "right" | "below";
  /** Extra delay as a share of the viewport, for items that share a row. */
  lag?: number;
  className?: string;
  children: ReactNode;
}) {
  const node = useRef<HTMLDivElement>(null);
  useScrollEntrance(node, { enabled, lag });

  return (
    <div
      ref={node}
      data-from={enabled ? from : undefined}
      className={className ? `${styles.entrance} ${className}` : styles.entrance}
    >
      {children}
    </div>
  );
}

export function useScrollEntrance(
  ref: RefObject<HTMLDivElement | null>,
  { enabled, lag = 0 }: { enabled: boolean; lag?: number },
) {
  const { scrollY } = useScroll();
  const navigation = useSectionNavigation(
    ref,
    () => Number(ref.current?.style.getPropertyValue("--entry") || 0) <= 0,
  );
  const { mode } = useAnimationPolicy();

  useLayoutEffect(() => {
    const element = ref.current;
    if (!enabled || !element) return;
    if (navigation.pending && mode !== "static") {
      element.style.setProperty("--entry", "0");
      return () => {
        element.style.removeProperty("--entry");
      };
    }
    let animation: ReturnType<typeof animate> | undefined;
    let peak = -1;
    const update = () => {
      if (animation) return;
      const travelled = (START * innerHeight - element.getBoundingClientRect().top) / innerHeight;
      const current = smoothstep(phaseProgress(travelled, lag, lag + SPAN));
      if (current <= peak) return;
      peak = current;
      element.style.setProperty("--entry", String(current));
    };
    // Keyboard focus never lands on something still faded out.
    const reveal = () => {
      animation?.stop();
      peak = 1;
      element.style.setProperty("--entry", "1");
    };
    const bounds = element.getBoundingClientRect();
    if (navigation.replay && mode !== "static" && bounds.top < innerHeight && bounds.bottom > 0) {
      element.style.setProperty("--entry", "0");
      animation = animate(0, 1, {
        duration: 0.8,
        onUpdate: (value) => element.style.setProperty("--entry", String(value)),
        onComplete: () => {
          peak = 1;
        },
      });
    } else update();
    const unsubscribe = scrollY.on("change", update);
    window.addEventListener("resize", update);
    element.addEventListener("focusin", reveal);
    return () => {
      unsubscribe();
      animation?.stop();
      window.removeEventListener("resize", update);
      element.removeEventListener("focusin", reveal);
      element.style.removeProperty("--entry");
    };
  }, [enabled, lag, scrollY, navigation.pending, navigation.replay, mode, ref]);
}
