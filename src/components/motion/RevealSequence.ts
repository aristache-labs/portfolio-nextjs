"use client";

import { createContext } from "react";

export type RevealPhase = "pending" | "prepared" | "complete" | "static";
type Listener = (phase: RevealPhase) => void;

export function createRevealSequence() {
  let phase: RevealPhase = "pending";
  const listeners = new Set<Listener>();
  return {
    subscribe(listener: Listener) {
      listeners.add(listener);
      listener(phase);
      return () => {
        listeners.delete(listener);
      };
    },
    publish(next: RevealPhase) {
      phase = next;
      listeners.forEach((listener) => listener(phase));
    },
  };
}

export const RevealSequence = createContext<ReturnType<typeof createRevealSequence> | null>(null);
