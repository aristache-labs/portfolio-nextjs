"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { cn } from "@/utils/cn";

const DEFAULT_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*?";

type Frame = { source: string; characters: string[]; revealed: number };

/** The real text reserves space and stays accessible; scrambling is a visual overlay only. */
export function EncryptedText({
  text,
  className,
  encryptedClassName,
  revealedClassName,
  revealDelayMs = 50,
  flipDelayMs = 50,
  charset = DEFAULT_CHARSET,
}: {
  text: string;
  className?: string;
  encryptedClassName?: string;
  revealedClassName?: string;
  revealDelayMs?: number;
  flipDelayMs?: number;
  charset?: string;
}) {
  const { mode, ready } = useAnimationPolicy();
  const enabled = mode !== "static";
  const playedText = useRef<string | null>(null);
  const [frame, setFrame] = useState<Frame | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!enabled) playedText.current = text;
    if (!enabled || playedText.current === text || !text.trim()) {
      const clear = requestAnimationFrame(() => setFrame(null));
      return () => cancelAnimationFrame(clear);
    }

    const characters = Array.from(text);
    const symbols = Array.from(charset || DEFAULT_CHARSET);
    const revealEvery = Number.isFinite(revealDelayMs) && revealDelayMs > 0 ? revealDelayMs : 50;
    const flipEvery = Number.isFinite(flipDelayMs) && flipDelayMs > 0 ? flipDelayMs : 50;
    let timer: ReturnType<typeof setInterval> | undefined;
    let active = true;
    const finish = () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      if (active) setFrame(null);
    };
    const onVisibility = () => {
      if (document.hidden) finish();
    };
    const kickoff = requestAnimationFrame(() => {
      playedText.current = text;
      if (document.hidden) return;
      const start = performance.now();
      const tick = () => {
        if (!active) return;
        const revealed = Math.floor((performance.now() - start) / revealEvery);
        if (revealed >= characters.length) {
          finish();
          return;
        }
        setFrame({
          source: text,
          revealed,
          characters: characters.map((character, index) =>
            index < revealed || /\s/u.test(character)
              ? character
              : symbols[Math.floor(Math.random() * symbols.length)],
          ),
        });
      };
      tick();
      timer = setInterval(tick, Math.max(16, Math.min(flipEvery, revealEvery)));
      document.addEventListener("visibilitychange", onVisibility);
    });

    return () => {
      active = false;
      cancelAnimationFrame(kickoff);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [text, enabled, ready, charset, revealDelayMs, flipDelayMs]);

  const visibleFrame = enabled && frame?.source === text ? frame : null;
  return (
    <span className={cn("inline-grid align-baseline", className)}>
      <span
        style={{ gridArea: "1 / 1" }}
        className={visibleFrame ? "text-transparent" : revealedClassName}
      >
        {text}
      </span>
      {visibleFrame && (
        <span
          aria-hidden="true"
          className="pointer-events-none select-none"
          style={{ gridArea: "1 / 1" }}
        >
          {visibleFrame.characters.map((character, index) => (
            <span
              key={index}
              className={index < visibleFrame.revealed ? revealedClassName : encryptedClassName}
            >
              {character}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
