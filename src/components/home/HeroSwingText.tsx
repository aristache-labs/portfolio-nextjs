"use client";

import { useEffect, useState, type CSSProperties } from "react";
import css from "./hero-swing.module.css";

const AWAY_SCROLL_PX = 60;

/** Decorative greeting whose letters swing from a rail. It drops in under the logo on desktop and
 *  puffs out once the page scrolls. */
export function HeroSwingText({ text = "WELCOME" }: { text?: string }) {
  const [away, setAway] = useState(false);

  useEffect(() => {
    const update = () => setAway(window.scrollY > AWAY_SCROLL_PX);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div className={css.anchor} data-away={away ? "" : undefined}>
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
  );
}
