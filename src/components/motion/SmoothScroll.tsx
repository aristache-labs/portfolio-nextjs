"use client";

import { useEffect } from "react";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { useHydratedPathname } from "@/hooks/useHydratedPathname";
import { setSmoothScroll } from "@/lib/smooth-scroll";

/** Admin and sign-in forms keep the browser's own scrolling. */
const PRIVATE_ROUTE = /^\/(admin|login)(\/|$)/;

/** A page lock either hides body overflow (site menu) or sets Radix's scroll-lock marker. */
function isPageLocked() {
  const { body } = document;
  return body.style.overflow === "hidden" || body.hasAttribute("data-scroll-locked");
}

/**
 * Inertial wheel scrolling for expressive desktop pointers. Touch devices, reduced motion and
 * private routes keep native scrolling. Lenis loads after hydration, outside the main bundle.
 */
export function SmoothScroll() {
  const { mode } = useAnimationPolicy();
  const pathname = useHydratedPathname();
  const enabled = mode === "expressive" && pathname !== null && !PRIVATE_ROUTE.test(pathname);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let cleanup = () => {};

    void import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      const lenis = new Lenis({
        duration: 1.4,
        wheelMultiplier: 0.85,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        syncTouch: false,
        autoRaf: true,
        // Menus, dialogs and the admin-like scroll areas inside them scroll on their own.
        allowNestedScroll: true,
        prevent: (node) => node.closest("[role='dialog'], [data-lenis-prevent]") !== null,
      });
      document.documentElement.classList.add("lenis");

      const syncLock = () => (isPageLocked() ? lenis.stop() : lenis.start());
      const observer = new MutationObserver(syncLock);
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ["style", "data-scroll-locked"],
      });
      syncLock();
      setSmoothScroll(lenis);

      cleanup = () => {
        observer.disconnect();
        setSmoothScroll(null);
        lenis.destroy();
        document.documentElement.classList.remove("lenis");
      };
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [enabled]);

  return null;
}

export default SmoothScroll;
