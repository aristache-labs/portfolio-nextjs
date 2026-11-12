"use client";

import type Lenis from "lenis";
import { beginSectionNavigation } from "./section-navigation";
import { getSmoothScroll } from "./smooth-scroll";
import { FOLD_VIEWPORT_QUERY, TOUCH_LANDSCAPE_QUERY } from "./motion-queries";

// A sine ease has the lowest top speed of the ease-in-out curves (about 1.6x the average), so the
// middle of a long jump does not rush. It still starts and stops softly.
const easeInOutSine = (progress: number) => (1 - Math.cos(Math.PI * progress)) / 2;
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
    easing: easeInOutSine,
    onComplete: () => stop(true),
  });
  return cancel;
}

const SECTION_NAV_GAP = 38;
/** Landscape phones have too little height to spare the full gap. */
const SHORT_LANDSCAPE_NAV_GAP = 14;

function navigationGap(target: HTMLElement) {
  if (
    (target.id === "about" ||
      target.id === "skills" ||
      target.id === "experience" ||
      target.id === "projects") &&
    window.matchMedia(
      "(min-width: 1750px) and (max-width: 1830px) and (min-height: 1000px) and (max-height: 1150px) and (orientation: landscape)",
    ).matches
  ) {
    return SECTION_NAV_GAP + 60;
  }
  if (
    (target.id === "skills" || target.id === "about" || target.id === "experience") &&
    window.matchMedia(
      "(min-width: 1105px) and (max-width: 1140px) and (min-height: 1500px) and (max-height: 1850px) and (orientation: portrait)",
    ).matches
  ) {
    return SECTION_NAV_GAP + (target.id === "about" ? 40 : 70);
  }
  if (
    target.id === "projects" &&
    window.matchMedia(
      "(min-width: 1340px) and (max-width: 1390px) and (min-height: 900px) and (max-height: 1050px) and (orientation: landscape)",
    ).matches
  ) {
    return SECTION_NAV_GAP + 16;
  }
  if (
    (target.id === "skills" || target.id === "experience") &&
    window.matchMedia(
      "(min-width: 1340px) and (max-width: 1390px) and (min-height: 900px) and (max-height: 1050px) and (orientation: landscape)",
    ).matches
  ) {
    return SECTION_NAV_GAP + 40;
  }
  if (
    target.id === "about" &&
    window.matchMedia(
      "(min-width: 1340px) and (max-width: 1390px) and (min-height: 900px) and (max-height: 1050px) and (orientation: landscape)",
    ).matches
  ) {
    return SECTION_NAV_GAP + 60;
  }
  if (
    target.id === "about" &&
    window.innerWidth <= 767 &&
    window.innerHeight > window.innerWidth &&
    !window.matchMedia(FOLD_VIEWPORT_QUERY).matches
  ) {
    return SECTION_NAV_GAP - 8;
  }
  if (
    target.id === "skills" &&
    (window.matchMedia(FOLD_VIEWPORT_QUERY).matches ||
      window.matchMedia("(min-width: 740px) and (max-width: 1023px) and (orientation: portrait)")
        .matches)
  ) {
    return SECTION_NAV_GAP + 40;
  }
  // Touch landscape tablets: land Skills higher so the last card row stays on screen.
  if (
    target.id === "skills" &&
    window.matchMedia(TOUCH_LANDSCAPE_QUERY).matches &&
    window.innerHeight > 500 &&
    window.innerHeight <= 800
  ) {
    // The single-column layout below 1100px needs the room; wider tablets use the desktop split.
    return window.innerWidth < 1100 ? SECTION_NAV_GAP - 28 : SECTION_NAV_GAP + 24;
  }
  return window.innerHeight <= 500 && window.innerWidth > window.innerHeight
    ? SHORT_LANDSCAPE_NAV_GAP
    : SECTION_NAV_GAP;
}

/** Compact bar heights from nav-chrome.module.css, matched to the same media queries. */
const COMPACT_NAV_HEIGHTS = {
  galaxyUltraPortrait: 80,
  shortLandscape: 44,
  ipadProPortrait: 64,
  ipadProLandscape: 70,
  default: 52,
} as const;

function compactNavHeight() {
  if (
    window.matchMedia(
      "(min-width: 1750px) and (max-width: 1830px) and (min-height: 1000px) and (max-height: 1150px) and (orientation: landscape)",
    ).matches
  )
    return 80;
  if (
    window.matchMedia(
      "(min-width: 1105px) and (max-width: 1140px) and (min-height: 1500px) and (max-height: 1850px) and (orientation: portrait)",
    ).matches
  )
    return COMPACT_NAV_HEIGHTS.galaxyUltraPortrait;
  if (
    window.matchMedia(
      "(min-width: 1340px) and (max-width: 1390px) and (min-height: 900px) and (max-height: 1050px) and (orientation: landscape)",
    ).matches
  )
    return COMPACT_NAV_HEIGHTS.ipadProLandscape;
  if (
    window.matchMedia(
      "(min-width: 1000px) and (max-width: 1100px) and (min-height: 1100px) and (min-aspect-ratio: 74/100) and (max-aspect-ratio: 5/4)",
    ).matches
  )
    return COMPACT_NAV_HEIGHTS.ipadProPortrait;
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
    const extraGap = target.id === "about" ? navigationGap(target) - SECTION_NAV_GAP : 0;
    return landing.getBoundingClientRect().top + window.scrollY - offset - extraGap;
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

  // Read again while scrolling: sections that render or load content on the way (landscape
  // phones skip off-screen sections) can move the target after the first measurement.
  const destination = () =>
    Math.max(
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
  destinationOrGetter: number | (() => number),
  reducedMotion: boolean,
  onFinish?: (arrived: boolean) => void,
): () => void {
  const resolve =
    typeof destinationOrGetter === "function" ? destinationOrGetter : () => destinationOrGetter;
  const destination = resolve();
  const start = window.scrollY;
  if (reducedMotion || Math.abs(destination - start) < 2) {
    window.scrollTo({ top: destination, behavior: "instant" });
    onFinish?.(true);
    return () => {};
  }

  // Roughly 1.1s per 1000px, so nearby sections still glide and far jumps are not rushed.
  const duration = Math.min(3200, Math.max(900, Math.abs(destination - start) * 1.1));
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
    const eased = easeInOutSine(progress);
    const goal = resolve();
    window.scrollTo({ top: start + (goal - start) * eased, behavior: "instant" });
    if (progress < 1) frame = requestAnimationFrame(tick);
    else settle();
  };
  // After arriving, follow the target until it stops moving (a section that finishes rendering
  // as it comes into view can still shift it), for at most about 40 frames.
  let stableFrames = 0;
  let settleFrames = 0;
  const settle = () => {
    const goal = resolve();
    if (Math.abs(goal - window.scrollY) > 1.5) {
      window.scrollTo({ top: goal, behavior: "instant" });
      stableFrames = 0;
    } else stableFrames += 1;
    settleFrames += 1;
    if (stableFrames >= 8 || settleFrames >= 40) stop(true);
    else frame = requestAnimationFrame(settle);
  };

  window.addEventListener("wheel", cancel, { passive: true });
  window.addEventListener("touchmove", cancel, { passive: true });
  window.addEventListener("keydown", onKey);
  window.addEventListener("pointerdown", cancel, { passive: true });
  frame = requestAnimationFrame(tick);
  return cancel;
}
