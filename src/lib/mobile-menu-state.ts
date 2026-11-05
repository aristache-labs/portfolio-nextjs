import { useSyncExternalStore } from "react";

let open = false;
const listeners = new Set<() => void>();
export function setMobileMenuOpen(value: boolean) {
  if (open === value) return;
  open = value;
  listeners.forEach((listener) => listener());
}
export function useMobileMenuOpen() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => open,
    () => false,
  );
}
