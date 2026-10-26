"use client";

import { useSyncExternalStore } from "react";

export const EXPRESSIVE_MOTION_QUERY = "(min-width: 1024px) and (pointer: fine) and (hover: hover)";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export type AnimationMode = "static" | "expressive" | "discreet";
type AnimationPolicy = { mode: AnimationMode; ready: boolean };
const policies = {
  pending: { mode: "static", ready: false },
  static: { mode: "static", ready: true },
  expressive: { mode: "expressive", ready: true },
  discreet: { mode: "discreet", ready: true },
} as const;

function subscribe(onChange: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const queries = [REDUCED_MOTION_QUERY, EXPRESSIVE_MOTION_QUERY].map((query) =>
    window.matchMedia(query),
  );
  queries.forEach((query) => query.addEventListener("change", onChange));
  return () => queries.forEach((query) => query.removeEventListener("change", onChange));
}

function getSnapshot() {
  if (typeof window.matchMedia !== "function" || window.matchMedia(REDUCED_MOTION_QUERY).matches) {
    return policies.static;
  }
  return window.matchMedia(EXPRESSIVE_MOTION_QUERY).matches
    ? policies.expressive
    : policies.discreet;
}

/** Static HTML is enhanced only after hydration has resolved device preferences. */
export function useAnimationPolicy() {
  return useSyncExternalStore<AnimationPolicy>(subscribe, getSnapshot, () => policies.pending);
}
