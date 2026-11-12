"use client";

import { useState, useEffect, useRef, type CSSProperties } from "react";
import { AnimatePresence, m, usePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useMobileMenuOpen } from "@/lib/mobile-menu-state";
import { useConsentInset } from "@/lib/consent-inset";
import { scrollToPosition } from "@/lib/scroll-to-section";
import { subscribeScroll } from "@/lib/scroll-state";
import styles from "./scroll-to-top.module.css";

/** Fallback for pages without the homepage sections, such as Privacy. */
const MIN_THRESHOLD = 400;
/** Length of the Puff Out keyframes in scroll-to-top.module.css. */
const PUFF_OUT_MS = 600;
const CONTENT_SECTIONS = ["about", "skills", "experience", "projects", "contact"];

/**
 * On the homepage the button appears at About, or the first visible section after Hero.
 * Other pages use a short reading threshold.
 */
function threshold() {
  const section = CONTENT_SECTIONS.map((id) => document.getElementById(id)).find(Boolean);
  if (section) return section.getBoundingClientRect().top + window.scrollY;
  const hero = document.getElementById("hero");
  return hero ? hero.getBoundingClientRect().bottom + window.scrollY : MIN_THRESHOLD;
}

const ScrollToTop = () => {
  const [show, setShow] = useState(false);
  const reduce = useReducedMotion();
  const inset = useConsentInset();
  const menuOpen = useMobileMenuOpen();
  const stopScroll = useRef<(() => void) | undefined>(undefined);
  useEffect(() => () => stopScroll.current?.(), []);

  useEffect(() => {
    const update = () => setShow(window.scrollY >= threshold());
    const unsubscribe = subscribeScroll(update);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(document.body);
    [...CONTENT_SECTIONS, "hero"].forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer?.observe(section);
    });
    update();
    return () => {
      observer?.disconnect();
      unsubscribe();
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
        <TopButton inset={inset} reduce={reduce} onClick={goToTop} />
      )}
    </AnimatePresence>
  );
};

/**
 * The button itself. It enters with Tada and leaves with Puff Out, both plain CSS keyframes
 * (scroll-to-top.module.css), so there is no framer enter or exit here. AnimatePresence only needs
 * to be told when the element may go: after the puff has run, or at once without motion.
 */
function TopButton({
  inset,
  reduce,
  onClick,
}: {
  inset: number;
  reduce: boolean;
  onClick: () => void;
}) {
  const [isPresent, safeToRemove] = usePresence();

  useEffect(() => {
    if (isPresent) return;
    if (reduce) {
      safeToRemove?.();
      return;
    }
    const timer = window.setTimeout(() => safeToRemove?.(), PUFF_OUT_MS);
    return () => window.clearTimeout(timer);
  }, [isPresent, reduce, safeToRemove]);

  return (
    <m.button
      style={{ "--consent-inset": `${inset}px` } as CSSProperties}
      type="button"
      onClick={onClick}
      aria-label="Scroll to top"
      data-leaving={isPresent ? undefined : ""}
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
  );
}

export default ScrollToTop;
