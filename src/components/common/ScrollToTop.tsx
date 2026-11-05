"use client";

import { useState, useEffect, useRef, type CSSProperties } from "react";
import { AnimatePresence, m } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useMobileMenuOpen } from "@/lib/mobile-menu-state";
import { useConsentInset } from "@/lib/consent-inset";
import { scrollToPosition } from "@/lib/scroll-to-section";
import styles from "./scroll-to-top.module.css";

/** Fallback for pages without the homepage sections, such as Privacy. */
const MIN_THRESHOLD = 400;

/**
 * On the homepage the button appears after Experience, falling back to earlier visible
 * sections when it is hidden. Other pages use a short reading threshold.
 */
function threshold() {
  const section = ["experience", "skills", "about", "hero"]
    .map((id) => document.getElementById(id))
    .find(Boolean);
  if (!section) return MIN_THRESHOLD;
  return section.getBoundingClientRect().bottom + window.scrollY;
}

const ScrollToTop = () => {
  const [show, setShow] = useState(false);
  const reduce = useReducedMotion();
  const inset = useConsentInset();
  const menuOpen = useMobileMenuOpen();
  const stopScroll = useRef<(() => void) | undefined>(undefined);
  useEffect(() => () => stopScroll.current?.(), []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setShow(window.scrollY >= threshold());
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(onScroll);
    observer?.observe(document.body);
    ["experience", "skills", "about", "hero"].forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer?.observe(section);
    });
    update();
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const goToTop = () => {
    const url = new URL(window.location.href);
    url.hash = "";
    window.history.replaceState(null, "", url);
    // Same paced, cancellable scroll as the section links. Native smooth scrolling covers the
    // whole page far faster and keeps running under a following section jump.
    stopScroll.current?.();
    stopScroll.current = scrollToPosition(0, reduce);
  };

  return (
    <AnimatePresence>
      {show && inset === 0 && !menuOpen && (
        <m.button
          style={{ "--consent-inset": `${inset}px` } as CSSProperties}
          type="button"
          onClick={goToTop}
          aria-label="Scroll to top"
          initial={reduce ? false : { opacity: 0, scale: 0.6, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, scale: 0.6, y: 12 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          whileHover={reduce ? undefined : { scale: 1.08 }}
          whileTap={reduce ? undefined : { scale: 0.92 }}
          className={`${styles.button} group border-border bg-surface fixed right-4 z-40 grid size-10 place-items-center overflow-hidden rounded-full border [filter:drop-shadow(0px_0px_7px_rgb(var(--brand-mid-rgb)/0.35))] backdrop-blur-md sm:right-8`}
        >
          {/* Gradient wash that fades in on hover */}
          <span
            aria-hidden
            className="absolute inset-0 bg-(image:--gradient-brand) opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
          {/* Arrow lifts and turns white as the gradient fills */}
          <ArrowUp
            className={`${styles.icon} text-foreground relative size-5 transition-[transform,color] duration-300 group-hover:-translate-y-0.5 group-hover:text-white motion-reduce:transform-none`}
            aria-hidden
          />
        </m.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTop;
