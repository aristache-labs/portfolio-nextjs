"use client";

import type Lenis from "lenis";
import { beginSectionNavigation } from "./section-navigation";
import { getSmoothScroll } from "./smooth-scroll";

// Smooth acceleration and deceleration, with no abrupt change at either end.
const smoothStep = (progress: number) => progress * progress * (3 - 2 * progress);
const NAVIGATION_KEYS = [
  "Escape",
  "ArrowDown",
  "ArrowUp",
  "PageDown",
  "PageUp",
  "Home",
  "End",
  " ",
];

/**
 * Lenis owns the scroll position while it runs, so a paced jump goes through it. Wheel input
 * already takes over inside Lenis; keys and pointer presses end the jump the same way as the
 * native path below.
 */
function scrollWithLenis(
  lenis: Lenis,
  destination: number,
  duration: number,
  onFinish?: (arrived: boolean) => void,
): () => void {
  let stopped = false;
  const stop = (arrived: boolean) => {
    if (stopped) return;
    stopped = true;
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("pointerdown", cancel);
    window.removeEventListener("wheel", release);
    onFinish?.(arrived);
  };
  // Wheel input re-targets Lenis by itself; other input freezes the jump where it is.
  const release = () => stop(false);
  const cancel = () => {
    if (!stopped) lenis.scrollTo(lenis.scroll, { immediate: true, force: true });
    stop(false);
  };
  const onKey = (event: KeyboardEvent) => {
    if (NAVIGATION_KEYS.includes(event.key)) cancel();
  };
  window.addEventListener("keydown", onKey);
  window.addEventListener("pointerdown", cancel, { passive: true });
  window.addEventListener("wheel", release, { passive: true });
  lenis.scrollTo(destination, {
    duration: duration / 1000,
    easing: smoothStep,
    onComplete: () => stop(true),
  });
  return cancel;
}

const SECTION_NAV_GAP = 38;
/** Landscape phones have too little height to spare the full gap. */
const SHORT_LANDSCAPE_NAV_GAP = 14;

function navigationGap(target: HTMLElement) {
  if (target.id === "about" && window.innerWidth <= 767 && window.innerHeight > window.innerWidth) {
    return SECTION_NAV_GAP - 8;
  }
  return window.innerHeight <= 500 && window.innerWidth > window.innerHeight
    ? SHORT_LANDSCAPE_NAV_GAP
    : SECTION_NAV_GAP;
}

/** Compact bar heights from nav-chrome.module.css, matched to the same media queries. */
const COMPACT_NAV_HEIGHTS = { shortLandscape: 44, default: 52 } as const;

function compactNavHeight() {
  if (
    window.matchMedia("(orientation: landscape) and (max-height: 500px) and (pointer: coarse)")
      .matches
  )
    return COMPACT_NAV_HEIGHTS.shortLandscape;
  return COMPACT_NAV_HEIGHTS.default;
}

/**
 * The bar height a section will sit under once the jump ends. The site bar shrinks as soon as
 * the page scrolls, so a jump that starts from the top uses the compact height it will land
 * with, not the full height measured at the moment of the click.
 */
function landingNavHeight() {
  const navigation = document.querySelector<HTMLElement>('header nav[aria-label="Primary"]');
  const header = navigation?.closest("header");
  if (header?.hasAttribute("data-shrinks") && !header.hasAttribute("data-compact")) {
    return compactNavHeight();
  }
  return navigation?.getBoundingClientRect().height ?? 72;
}

/** Align section content consistently below the responsive navigation bar. */
export function sectionScrollPosition(target: HTMLElement): number {
  // A pinned scene names the viewport offset where its track should sit.
  const landing = target.querySelector<HTMLElement>("[data-scroll-landing]");
  if (landing) {
    const offset = Number(landing.dataset.scrollLanding) || 0;
    return landing.getBoundingClientRect().top + window.scrollY - offset;
  }
  const anchor = target.querySelector<HTMLElement>("[data-scroll-anchor]");
  if (anchor) {
    return (
      anchor.getBoundingClientRect().top +
      window.scrollY -
      landingNavHeight() -
      navigationGap(target)
    );
  }
  const margin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  return target.getBoundingClientRect().top + window.scrollY - margin;
}

/** A paced anchor transition that yields immediately to manual navigation. */
export function scrollToSection(id: string, reducedMotion: boolean): () => void {
  const target = document.getElementById(id);
  if (!target) return () => {};

  const destination = Math.max(
    0,
    Math.min(
      sectionScrollPosition(target),
      document.documentElement.scrollHeight - window.innerHeight,
    ),
  );
  const url = new URL(window.location.href);
  url.hash = id;
  // Let Next copy its internal history state and synchronize the router URL.
  // Passing history.state back would bypass its public replaceState integration.
  window.history.replaceState(null, "", url);
  const finish = beginSectionNavigation(target);
  return scrollToPosition(destination, reducedMotion, finish);
}

/** Paced scroll to a document offset, cancelled by any manual input. */
export function scrollToPosition(
  destination: number,
  reducedMotion: boolean,
  onFinish?: (arrived: boolean) => void,
): () => void {
  const start = window.scrollY;
  if (reducedMotion || Math.abs(destination - start) < 2) {
    window.scrollTo({ top: destination, behavior: "instant" });
    onFinish?.(true);
    return () => {};
  }

  const duration = Math.min(1400, Math.max(300, (Math.abs(destination - start) / 1600) * 1000));
  const lenis = getSmoothScroll();
  if (lenis) return scrollWithLenis(lenis, destination, duration, onFinish);
  let frame = 0;
  let startedAt: number | undefined;
  let stopped = false;
  const stop = (arrived = false) => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frame);
    window.removeEventListener("wheel", cancel);
    window.removeEventListener("touchmove", cancel);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("pointerdown", cancel);
    onFinish?.(arrived);
  };
  const cancel = () => stop();
  const onKey = (event: KeyboardEvent) => {
    if (NAVIGATION_KEYS.includes(event.key)) stop();
  };
  const tick = (now: number) => {
    startedAt ??= now;
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = smoothStep(progress);
    window.scrollTo({ top: start + (destination - start) * eased, behavior: "instant" });
    if (progress < 1) frame = requestAnimationFrame(tick);
    else stop(true);
  };

  window.addEventListener("wheel", cancel, { passive: true });
  window.addEventListener("touchmove", cancel, { passive: true });
  window.addEventListener("keydown", onKey);
  window.addEventListener("pointerdown", cancel, { passive: true });
  frame = requestAnimationFrame(tick);
  return cancel;
}
