import { useSyncExternalStore } from "react";

let inset = 0;
const listeners = new Set<() => void>();

export function setConsentInset(value: number) {
  const next = Number.isFinite(value) ? Math.max(0, value) : 0;
  if (next === inset) return;
  inset = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useConsentInset() {
  return useSyncExternalStore(
    subscribe,
    () => inset,
    () => 0,
  );
}
