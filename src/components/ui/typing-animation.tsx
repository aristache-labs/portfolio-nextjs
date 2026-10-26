"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { cn } from "@/utils/cn";
import styles from "./typing-animation.module.css";

type Frame = { source: string; value: string; playing: boolean };

/** A visual typing loop over stable, accessible text that reserves the full greeting width. */
export function TypingAnimation({
  children: text,
  className,
  blinkCursor = true,
  pauseDelay = 2000,
  loop = false,
  typeSpeed = 100,
  deleteSpeed = 50,
}: {
  children: string;
  className?: string;
  blinkCursor?: boolean;
  pauseDelay?: number;
  loop?: boolean;
  typeSpeed?: number;
  deleteSpeed?: number;
}) {
  const { mode, ready } = useAnimationPolicy();
  const enabled = ready && mode !== "static";
  const element = useRef<HTMLSpanElement>(null);
  const [frame, setFrame] = useState<Frame | null>(null);

  useEffect(() => {
    const node = element.current;
    if (!enabled || !node || !text) return;
    const characters = Array.from(text);
    const typingMs = Number.isFinite(typeSpeed) && typeSpeed > 0 ? typeSpeed : 100;
    const deletingMs = Number.isFinite(deleteSpeed) && deleteSpeed > 0 ? deleteSpeed : 50;
    const pauseMs = Number.isFinite(pauseDelay) && pauseDelay >= 0 ? pauseDelay : 2000;
    let count = 0;
    let phase: "typing" | "pause" | "deleting" | "complete" = "typing";
    let timer: ReturnType<typeof setTimeout> | undefined;
    let started = false;
    let disposed = false;
    let visible = typeof IntersectionObserver !== "function";

    const paint = (playing: boolean) =>
      setFrame({ source: text, value: characters.slice(0, count).join(""), playing });
    const schedule = () => {
      if (phase === "complete") return;
      const delay = phase === "typing" ? typingMs : phase === "pause" ? pauseMs : deletingMs;
      timer = setTimeout(tick, delay);
    };
    const tick = () => {
      timer = undefined;
      if (disposed || !visible || document.hidden) return;
      if (phase === "typing") {
        count += 1;
        if (count === characters.length) phase = "pause";
      } else if (phase === "pause") {
        if (loop) {
          phase = "deleting";
          count -= 1;
          if (count === 0) phase = "typing";
        } else phase = "complete";
      } else if (phase === "deleting") {
        count -= 1;
        if (count === 0) phase = "typing";
      }
      paint(true);
      schedule();
    };
    const sync = () => {
      if (disposed) return;
      if (!visible || document.hidden) {
        clearTimeout(timer);
        timer = undefined;
        if (started) paint(false);
        return;
      }
      started = true;
      paint(true);
      if (timer === undefined) schedule();
    };
    let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver === "function") {
      observer = new IntersectionObserver((entries) => {
        const entry = entries.find((item) => item.target === node);
        if (!entry) return;
        visible = entry.isIntersecting;
        sync();
      });
      observer.observe(node);
    }
    const kickoff = requestAnimationFrame(sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      disposed = true;
      cancelAnimationFrame(kickoff);
      clearTimeout(timer);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [text, enabled, loop, typeSpeed, deleteSpeed, pauseDelay]);

  const visibleFrame = enabled && frame?.source === text ? frame : null;
  return (
    <span
      ref={element}
      className={cn("relative inline-grid pr-[0.5em] align-baseline", className)}
      data-playing={visibleFrame?.playing ?? false}
    >
      <span className={visibleFrame ? "text-transparent" : undefined}>{text}</span>
      {visibleFrame && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
          <span>{visibleFrame.value}</span>
          <span className={cn(styles.cursor, blinkCursor && styles.blink)} />
        </span>
      )}
    </span>
  );
}
