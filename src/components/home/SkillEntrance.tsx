"use client";

import { m } from "framer-motion";
import { useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { createRevealSequence, RevealSequence } from "@/components/motion/RevealSequence";

/** Each card starts its progress as soon as its own entrance finishes. */
export function SkillEntrance({ filtered, children }: { filtered: boolean; children: ReactNode }) {
  const parent = useContext(RevealSequence);
  const { mode, ready } = useAnimationPolicy();
  const [entersOnMount] = useState(filtered);
  const sequence = useMemo(() => createRevealSequence(), []);
  const entered = useRef(false);
  const filterEntered = useRef(!filtered);
  const complete = () => {
    if (mode === "static") sequence.publish("static");
    else if (entered.current && filterEntered.current) sequence.publish("complete");
  };

  useEffect(() => {
    if (!ready) return;
    if (mode === "static") {
      sequence.publish("static");
      return;
    }
    return parent?.subscribe((phase) => {
      if (phase === "pending") return;
      if (phase === "prepared") sequence.publish("prepared");
      if (phase === "static") {
        if (entersOnMount && !filterEntered.current) sequence.publish("prepared");
        else sequence.publish("static");
        entered.current = true;
      }
      if (phase === "complete" && entersOnMount) {
        entered.current = true;
        if (filterEntered.current) sequence.publish("complete");
        else sequence.publish("prepared");
      }
    });
  }, [entersOnMount, mode, parent, ready, sequence]);

  return (
    <m.div
      layout={mode === "static" ? false : "position"}
      transition={{ layout: { type: "spring", damping: 20, stiffness: 300 } }}
      initial={false}
      variants={{
        hidden:
          mode === "static"
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: mode === "expressive" ? 16 : 8 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: mode === "static" ? 0 : 1.3, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      className="min-w-0"
      onAnimationComplete={(definition) => {
        if (definition !== "visible") return;
        entered.current = true;
        complete();
      }}
    >
      <m.div
        className="h-full"
        initial={entersOnMount && mode !== "static" ? { opacity: 0, scale: 0.96 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: mode === "static" ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
        onAnimationComplete={() => {
          filterEntered.current = true;
          complete();
        }}
      >
        <RevealSequence.Provider value={sequence}>{children}</RevealSequence.Provider>
      </m.div>
    </m.div>
  );
}
