"use client";

import { useEffect, useState } from "react";
import { useHydratedPathname } from "@/hooks/useHydratedPathname";
import { PORTRAIT_PHONE_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import styles from "./rotate-hint.module.css";

const SEEN_KEY = "aristache:rotate-hint";
/**
 * Total lifetime. The intro curtain lifts at ~0.8s and the overlay fades in behind it, so about
 * 5.5 seconds are on screen: time to watch the phone turn all the way and read the message.
 */
const LIFETIME_MS = 6400;
/**
 * Set to true to bring the overlay back on every visit, for reviewing it. The real behaviour is
 * once per browser session.
 */
export const SHOW_EVERY_VISIT = false;

/** Matches the fade-out in the stylesheet. */
const FADE_OUT_MS = 240;
/** Any of these means the visitor wants the page, not the suggestion. */
const DISMISS_EVENTS = ["pointerdown", "touchstart", "wheel", "keydown", "scroll"] as const;

const rememberSeen = () => {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* A blocked store only means the overlay may show again on the next visit. */
  }
};

const alreadySeen = () => {
  try {
    return sessionStorage.getItem(SEEN_KEY) !== null;
  } catch {
    return false;
  }
};

type Phase = "showing" | "leaving" | "gone";

/**
 * Portrait phones, first homepage visit of the session: a full-screen blurred overlay above the
 * hero suggests turning the phone sideways, with a small phone that tips over and shows the
 * same picture wider. It lasts about six seconds and vanishes the instant the visitor touches,
 * scrolls or presses anything. While it fades out it no longer takes pointer events, so the tap
 * that dismissed it can never activate a button underneath.
 */
export default function RotateHint({ everyVisit = SHOW_EVERY_VISIT }: { everyVisit?: boolean }) {
  const onHomepage = useHydratedPathname() === "/";
  const portraitPhone = useMediaQuery(`${PORTRAIT_PHONE_QUERY} and (pointer: coarse)`);
  const [seenBefore] = useState(() => !everyVisit && alreadySeen());
  const [phase, setPhase] = useState<Phase>("showing");
  const active = onHomepage && portraitPhone && !seenBefore && phase !== "gone";

  useEffect(() => {
    if (!active) return;
    if (!everyVisit) rememberSeen();
    const leave = () => setPhase((current) => (current === "showing" ? "leaving" : current));
    const timer = window.setTimeout(leave, LIFETIME_MS);
    DISMISS_EVENTS.forEach((type) =>
      window.addEventListener(type, leave, { passive: true, capture: true }),
    );
    return () => {
      window.clearTimeout(timer);
      DISMISS_EVENTS.forEach((type) => window.removeEventListener(type, leave, { capture: true }));
    };
  }, [active, everyVisit]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = window.setTimeout(() => setPhase("gone"), FADE_OUT_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (!active) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-phase={phase}
      className={`${styles.overlay} ${phase === "leaving" ? styles.leaving : ""}`}
    >
      <div className={styles.stage}>
        <p className={`${styles.title} font-display`}>
          Shift Your <span className={styles.accent}>Perspective</span>
        </p>
        <div aria-hidden className={styles.scene}>
          <span className={styles.glow} />
          <svg className={styles.arc} viewBox="0 0 168 168" focusable="false">
            <path className={styles.arcLine} d="M 84 10 A 74 74 0 0 0 10 84" />
            <path className={styles.arcHead} d="M 3 76 L 10 87 L 17 76" />
          </svg>
          <div className={styles.device}>
            <div className={styles.screen}>
              {/* The same hero picture, kept upright while the phone turns, so the wider screen
                  shows more of it. Plain img: it is decoration and already in the cache. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/media/hero-portrait.webp"
                alt=""
                width={150}
                height={150}
                decoding="async"
                draggable={false}
                className={styles.shot}
              />
            </div>
          </div>
        </div>
        <p className={styles.message}>Rotate your device for the full experience</p>
        <p className={styles.tap}>
          <span aria-hidden className={styles.tapDot} />
          Tap to continue
        </p>
      </div>
    </div>
  );
}
