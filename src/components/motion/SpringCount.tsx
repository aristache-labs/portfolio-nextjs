"use client";

import { animate } from "framer-motion";
import { useContext, useEffect, useRef } from "react";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { RevealSequence } from "./RevealSequence";

/** Preserve the supplied grouping, precision, prefix and suffix. */
export function countFormat(value: string) {
  const match = value.match(/^(\D*)(\d+(?:,\d{3})*(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  const [, prefix, digits, suffix] = match;
  const target = Number(digits.replaceAll(",", ""));
  if (!Number.isFinite(target)) return null;
  const precision = digits.split(".")[1]?.length ?? 0;
  return {
    target,
    format: (progress: number) => {
      const fixed = Math.min(target, Math.max(0, progress)).toFixed(precision);
      const [integer, fraction] = fixed.split(".");
      const grouped = digits.includes(",")
        ? integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        : integer;
      return `${prefix}${grouped}${fraction === undefined ? "" : `.${fraction}`}${suffix}`;
    },
  };
}

export function SpringCount({ value }: { value: string }) {
  const { mode, ready } = useAnimationPolicy();
  const sequence = useContext(RevealSequence);
  const element = useRef<HTMLSpanElement>(null);
  const output = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!ready || !element.current || !output.current) return;
    const node = element.current;
    const text = output.current;
    const number = countFormat(value);
    let active = true;
    let observer: IntersectionObserver | undefined;
    let animation: ReturnType<typeof animate> | undefined;
    const finish = () => {
      started.current = true;
      observer?.disconnect();
      animation?.stop();
      text.textContent = value;
    };
    const onScrollEnd = () => {
      if (!started.current && node.getBoundingClientRect().top < window.innerHeight) finish();
    };
    const start = (delay: number) => {
      if (started.current || !number) return;
      started.current = true;
      observer?.disconnect();
      animation = animate(0, number.target, {
        type: "spring",
        stiffness: 90,
        damping: 20,
        mass: 1,
        delay,
        onUpdate: (current) => {
          if (active) text.textContent = number.format(current);
        },
        onComplete: () => {
          if (active) text.textContent = value;
        },
      });
    };
    let unsubscribe: (() => void) | undefined;

    if (sequence && mode !== "static" && number && !started.current) {
      // The enclosing zoom owns the viewport trigger and signals its actual completion.
      unsubscribe = sequence.subscribe((phase) => {
        if (phase === "prepared") text.textContent = number.format(0);
        if (phase === "complete") start(0);
        if (phase === "static") finish();
      });
    } else if (
      started.current ||
      mode === "static" ||
      !number ||
      typeof IntersectionObserver !== "function" ||
      node.getBoundingClientRect().top <= window.innerHeight
    ) {
      finish();
    } else {
      // Enhance only offscreen content; server HTML and the first client render stay final.
      text.textContent = number.format(0);
      observer = new IntersectionObserver(
        (entries) => {
          if (!active || started.current) return;
          const entry = entries.find((item) => item.target === node);
          if (!entry) return;
          if (!entry.isIntersecting) {
            if (entry.boundingClientRect.bottom <= 0) finish();
            return;
          }
          start(0.3);
        },
        { rootMargin: `0px 0px -${Math.min(120, Math.round(window.innerHeight * 0.15))}px 0px` },
      );
      observer.observe(node);
      window.addEventListener("scrollend", onScrollEnd);
    }

    return () => {
      active = false;
      unsubscribe?.();
      observer?.disconnect();
      animation?.stop();
      window.removeEventListener("scrollend", onScrollEnd);
      text.textContent = value;
    };
  }, [mode, ready, sequence, value]);

  return (
    <span ref={element} className="relative inline-grid tabular-nums">
      {/* This final value reserves space and remains the only accessible text. */}
      <span className="col-start-1 row-start-1 opacity-0">{value}</span>
      <span ref={output} aria-hidden="true" className="col-start-1 row-start-1">
        {value}
      </span>
    </span>
  );
}
