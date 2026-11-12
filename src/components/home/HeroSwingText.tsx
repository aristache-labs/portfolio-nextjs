"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import css from "./hero-swing.module.css";

const AWAY_SCROLL_PX = 60;
/** The rail line tucks this share of the wordmark's height up over its bottom edge. */
const LINE_OVERLAP = 0.18;
/** The rail starts this far right of the wordmark's left edge. */
const LINE_INSET = 4;

/** Where an element sits in the page by layout alone, ignoring transforms. */
function layoutPosition(element: HTMLElement) {
  let top = 0;
  let left = 0;
  for (
    let node: HTMLElement | null = element;
    node;
    node = node.offsetParent as HTMLElement | null
  ) {
    top += node.offsetTop;
    left += node.offsetLeft;
  }
  return { top, left };
}

/** Decorative greeting whose letters swing from a rail. It drops in under the logo on desktop and
 *  puffs out once the page scrolls. */
export function HeroSwingText({ text = "WELCOME" }: { text?: string }) {
  const [away, setAway] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const origin = useRef<HTMLDivElement>(null);

  // Hang the rail right under the header wordmark at any screen size. The header and the hero
  // scale separately, so fixed offsets drift apart; this measures the real wordmark instead and
  // falls back to the CSS offsets when it cannot be found.
  const place = useCallback(() => {
    const node = anchor.current;
    const start = origin.current;
    // Once scrolled the header is compact, and the greeting is already faded out.
    if (!node || !start || window.scrollY > 1) return;
    const wordmark = document.querySelector<HTMLElement>("header img[class*='wordmark']");
    if (!wordmark || getComputedStyle(start).display === "none") return;
    // Layout offsets, not bounding boxes: the hero's entrance animation transforms its content,
    // and a bounding box measured mid-animation would put the greeting in the wrong place.
    const from = layoutPosition(start);
    const to = wordmark.getBoundingClientRect();
    if (!to.width || !to.height) return;
    node.style.setProperty("--swing-top", `${to.bottom - to.height * LINE_OVERLAP - from.top}px`);
    node.style.setProperty("--swing-left", `${to.left + LINE_INSET - from.left}px`);
  }, []);

  useLayoutEffect(() => {
    place();
    const wordmark = document.querySelector("header img[class*='wordmark']");
    const watch =
      typeof ResizeObserver === "function" ? new ResizeObserver(() => place()) : undefined;
    if (wordmark) watch?.observe(wordmark);
    if (origin.current?.parentElement) watch?.observe(origin.current.parentElement);
    window.addEventListener("resize", place);
    window.addEventListener("load", place);
    void document.fonts?.ready.then(place);
    // The header can still be settling when the hero mounts behind the intro.
    const settle = window.setTimeout(place, 1500);
    return () => {
      watch?.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("load", place);
      window.clearTimeout(settle);
    };
  }, [place]);

  useEffect(() => {
    const update = () => setAway(window.scrollY > AWAY_SCROLL_PX);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  // Back at the top the header is full size again, so measure once more.
  useEffect(() => {
    if (!away) place();
  }, [away, place]);

  return (
    <>
      <div ref={origin} aria-hidden className={css.origin} />
      <div ref={anchor} className={css.anchor} data-away={away ? "" : undefined}>
        <div className={css.swing}>
          <span className="sr-only">{text}</span>
          <span aria-hidden className={css.rail}>
            {[...text].map((letter, index) => (
              <span key={index} className={css.letter} style={{ "--i": index } as CSSProperties}>
                {letter}
              </span>
            ))}
          </span>
        </div>
      </div>
    </>
  );
}
