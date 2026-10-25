"use client";

/** A centered section can expose its content start as the desktop anchor. */
export function sectionScrollPosition(target: HTMLElement): number {
  const anchor = window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches
    ? (target.querySelector<HTMLElement>("[data-desktop-scroll-anchor]") ?? target)
    : target;
  const margin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  const contentOffset = anchor === target ? 0 : 30;
  return anchor.getBoundingClientRect().top + window.scrollY - margin - contentOffset;
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
  window.history.replaceState(window.history.state, "", `#${id}`);
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
