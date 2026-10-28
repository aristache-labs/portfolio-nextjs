"use client";

const SECTION_NAV_GAP = 38;

/** Align section content consistently below the responsive navigation bar. */
export function sectionScrollPosition(target: HTMLElement): number {
  const anchor = target.querySelector<HTMLElement>("[data-scroll-anchor]");
  if (anchor) {
    const navigation = document.querySelector<HTMLElement>('header nav[aria-label="Primary"]');
    const navigationHeight = navigation?.getBoundingClientRect().height ?? 72;
    return anchor.getBoundingClientRect().top + window.scrollY - navigationHeight - SECTION_NAV_GAP;
  }
  const margin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  return target.getBoundingClientRect().top + window.scrollY - margin;
}

/** A paced anchor transition that yields immediately to manual navigation. */
export function scrollToSection(id: string, reducedMotion: boolean): () => void {
  const target = document.getElementById(id);
  if (!target) return () => {};

  const start = window.scrollY;
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
  if (reducedMotion || Math.abs(destination - start) < 2) {
    window.scrollTo({ top: destination, behavior: "instant" });
    return () => {};
  }

  const duration = Math.min(1400, Math.max(300, (Math.abs(destination - start) / 1600) * 1000));
  let frame = 0;
  let startedAt: number | undefined;
  const stop = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("wheel", stop);
    window.removeEventListener("touchmove", stop);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("pointerdown", stop);
  };
  const onKey = (event: KeyboardEvent) => {
    if (
      ["Escape", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(
        event.key,
      )
    )
      stop();
  };
  const tick = (now: number) => {
    startedAt ??= now;
    const progress = Math.min(1, (now - startedAt) / duration);
    // Smooth acceleration and deceleration, with no abrupt change at either end.
    const eased = progress * progress * (3 - 2 * progress);
    window.scrollTo({ top: start + (destination - start) * eased, behavior: "instant" });
    if (progress < 1) frame = requestAnimationFrame(tick);
    else stop();
  };

  window.addEventListener("wheel", stop, { passive: true });
  window.addEventListener("touchmove", stop, { passive: true });
  window.addEventListener("keydown", onKey);
  window.addEventListener("pointerdown", stop, { passive: true });
  frame = requestAnimationFrame(tick);
  return stop;
}
