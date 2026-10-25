"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

const subscribe = () => () => {};
const getServerSnapshot = () => null;

/**
 * Vercel can prerender the homepage at /index and serve it at /. Keep route-dependent
 * markup stable during hydration, then follow the browser route and client navigation.
 * usePathname supplies route updates, so this store needs no additional subscription.
 */
export function useHydratedPathname(): string | null {
  const pathname = usePathname();
  return useSyncExternalStore(subscribe, () => pathname, getServerSnapshot);
}
