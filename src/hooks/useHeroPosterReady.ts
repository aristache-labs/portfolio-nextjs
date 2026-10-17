"use client";

import { useSyncExternalStore } from "react";

const HERO_POSTER = '#hero img[fetchpriority="high"]';

function isHeroPosterReady() {
  // complete also covers a failed image. A missing hero must not block other sections.
  return document.querySelector<HTMLImageElement>(HERO_POSTER)?.complete ?? true;
}

function subscribeToHeroPoster(onChange: () => void) {
  const onSettled = (event: Event) => {
    if (event.target instanceof HTMLImageElement && event.target.matches(HERO_POSTER)) onChange();
  };
  // Image load/error events do not bubble, so listen during capture.
  document.addEventListener("load", onSettled, true);
  document.addEventListener("error", onSettled, true);
  return () => {
    document.removeEventListener("load", onSettled, true);
    document.removeEventListener("error", onSettled, true);
  };
}

const subscribeToNothing = () => () => {};
const heroPosterServerSnapshot = () => false;

/** Wait for the hero before exposing another image URL to the browser. */
export function useHeroPosterReady(enabled = true) {
  const ready = useSyncExternalStore(
    enabled ? subscribeToHeroPoster : subscribeToNothing,
    isHeroPosterReady,
    heroPosterServerSnapshot,
  );
  return !enabled || ready;
}
