"use client";

import { useSectionNavigation } from "@/hooks/useSectionNavigation";
import { sectionNavigationPending } from "@/lib/section-navigation";

import { m, useAnimationControls } from "framer-motion";
import {
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { createRevealSequence, RevealSequence } from "@/components/motion/RevealSequence";

/** Solid tablet cards reveal by clipping and moving, without fading their surface. */
export function SolidSkillEntrance({
  filtered,
  order = 0,
  ref,
  children,
}: {
  filtered: boolean;
  order?: number;
  ref?: Ref<HTMLDivElement>;
  children: ReactNode;
}) {
  const node = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => node.current!, []);
  const controls = useAnimationControls();
  const { mode, ready } = useAnimationPolicy();
  const entered = useRef(false);
  const [entersOnMount] = useState(filtered);
  const sequence = useMemo(() => createRevealSequence(), []);
  const navigation = useSectionNavigation(node, () => !entered.current);

  useEffect(() => {
    if (!ready || !node.current || navigation.pending) return;
    let active = true;
    let started = false;
    const settled = {
      transform: "translateY(0px) scale(1)",
      clipPath: "inset(0% 0% 0% 0% round 16px)",
    };
    if (mode === "static" || entered.current || typeof IntersectionObserver !== "function") {
      controls.set(settled);
      sequence.publish("static");
      return;
    }
    controls.set({
      transform: `translateY(${entersOnMount ? 18 : 32}px) scale(0.97)`,
      clipPath: entersOnMount ? "inset(0% 0% 0% 0% round 16px)" : "inset(0% 0% 100% 0% round 16px)",
    });
    sequence.publish("prepared");
    const start = () => {
      if (started) return;
      started = true;
      void controls
        .start({
          ...settled,
          transition: {
            duration: entersOnMount ? 0.28 : 0.45,
            delay: entersOnMount ? Math.min(order, 3) * 0.035 : Math.min(order, 11) * 0.045,
            ease: [0.22, 1, 0.36, 1],
          },
        })
        .then(() => {
          if (!active) return;
          entered.current = true;
          sequence.publish("complete");
        });
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && node.current && !sectionNavigationPending(node.current))
          start();
      },
      { threshold: 0.1 },
    );
    if (entersOnMount) start();
    else observer.observe(node.current);
    const focus = () => {
      controls.set(settled);
      entered.current = true;
      sequence.publish("static");
    };
    const element = node.current;
    element.addEventListener("focusin", focus);
    return () => {
      active = false;
      observer.disconnect();
      controls.stop();
      element.removeEventListener("focusin", focus);
    };
  }, [
    ready,
    mode,
    controls,
    sequence,
    entersOnMount,
    order,
    navigation.pending,
    navigation.replay,
  ]);

  return (
    <div ref={node} className="min-w-0">
      <m.div
        className="h-full"
        initial={
          entersOnMount && mode !== "static"
            ? {
                transform: "translateY(18px) scale(0.97)",
              }
            : false
        }
        animate={controls}
      >
        <RevealSequence.Provider value={sequence}>{children}</RevealSequence.Provider>
      </m.div>
    </div>
  );
}

/** Each card starts its progress as soon as its own entrance finishes. */
export function SkillEntrance({
  filtered,
  skipEntrance = false,
  order = 0,
  mobile = false,
  landscape = false,
  ref,
  children,
}: {
  filtered: boolean;
  /** An automatic reset restores cards without replaying their first entrance. */
  skipEntrance?: boolean;
  /** Position in the grid, so cards brought in by a filter arrive in turn. */
  order?: number;
  mobile?: boolean;
  landscape?: boolean;
  /** Lets AnimatePresence pop a leaving card out of the grid flow. */
  ref?: Ref<HTMLDivElement>;
  children: ReactNode;
}) {
  const parent = useContext(RevealSequence);
  const nodeRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => nodeRef.current!, []);
  const controls = useAnimationControls();
  const { mode, ready } = useAnimationPolicy();
  const preserveSurface = mode === "expressive" || landscape;
  const [entersOnMount] = useState(filtered);
  const sequence = useMemo(() => createRevealSequence(), []);
  const entered = useRef(false);
  const filterEntered = useRef(!filtered);
  const navigation = useSectionNavigation(nodeRef, () => !entered.current);
  const complete = () => {
    if (mode === "static" || skipEntrance) sequence.publish("static");
    else if (entered.current && filterEntered.current) sequence.publish("complete");
  };

  useEffect(() => {
    if (!ready || navigation.pending) return;
    if (mobile) return;
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
  }, [entersOnMount, mode, parent, ready, sequence, mobile, navigation.pending, navigation.replay]);

  useEffect(() => {
    const node = nodeRef.current;
    if (!mobile || !ready || !node || navigation.pending) return;
    let active = true;
    let started = false;
    // The card's glass (backdrop-filter) is not drawn while an ancestor is translucent, so the
    // wrapper only moves and the fade travels to the card itself through a custom property.
    const settled = { "--skill-entry-opacity": 1, x: 0, y: 0, scale: 1 };
    const finish = () => {
      controls.stop();
      controls.set(settled);
      entered.current = true;
      sequence.publish("static");
    };
    if (
      mode === "static" ||
      skipEntrance ||
      entered.current ||
      typeof IntersectionObserver !== "function"
    ) {
      finish();
      return;
    }
    if (entersOnMount) {
      entered.current = true;
      sequence.publish(filterEntered.current ? "complete" : "prepared");
      return;
    }
    controls.set({
      "--skill-entry-opacity": 0,
      x: landscape ? -32 : 0,
      y: landscape ? 0 : 40,
      scale: landscape ? 0.94 : 0.93,
    });
    sequence.publish("prepared");
    const start = () => {
      if (started || entered.current) return;
      started = true;
      observer?.disconnect();
      void controls
        .start({
          ...settled,
          transition: { duration: 0.75, delay: (order % 2) * 0.1, ease: [0.22, 1, 0.36, 1] },
        })
        .then(() => {
          if (!active) return;
          entered.current = true;
          sequence.publish("complete");
        });
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (sectionNavigationPending(node)) return;
        if (entry?.isIntersecting && entry.intersectionRatio >= 0.1) start();
        else if (entry && entry.boundingClientRect.bottom <= 0) {
          observer.disconnect();
          finish();
        }
      },
      { rootMargin: "0px 0px -32px 0px", threshold: 0.1 },
    );
    const focus = () => {
      observer?.disconnect();
      finish();
    };
    const skipped = () => {
      if (!started && node.getBoundingClientRect().bottom <= 0) focus();
    };
    observer.observe(node);
    node.addEventListener("focusin", focus);
    window.addEventListener("scrollend", skipped);
    return () => {
      active = false;
      observer?.disconnect();
      controls.stop();
      node.removeEventListener("focusin", focus);
      window.removeEventListener("scrollend", skipped);
    };
  }, [
    mobile,
    landscape,
    ready,
    mode,
    controls,
    sequence,
    entersOnMount,
    order,
    skipEntrance,
    navigation.pending,
    navigation.replay,
  ]);

  return (
    <m.div
      ref={nodeRef}
      animate={mobile ? controls : undefined}
      layout={mode === "static" ? false : "position"}
      transition={{ layout: { type: "spring", damping: 20, stiffness: 300 } }}
      exit={
        mode === "static"
          ? undefined
          : { opacity: 0, scale: 0.94, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }
      }
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
        initial={
          entersOnMount && mode !== "static"
            ? { opacity: preserveSurface ? 1 : 0, scale: 0.96 }
            : false
        }
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: mode === "static" ? 0 : 0.35,
          delay: entersOnMount && mode !== "static" ? Math.min(order, 11) * 0.04 : 0,
          ease: [0.22, 1, 0.36, 1],
        }}
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
