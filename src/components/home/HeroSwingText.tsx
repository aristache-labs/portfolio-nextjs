import type { CSSProperties } from "react";
import css from "./hero-swing.module.css";

export function HeroSwingText({ away }: { away: boolean }) {
  return (
    <span aria-hidden className={css.anchor} data-away={away ? "" : undefined}>
      <span className={css.rail}>
        {[..."WELCOME"].map((letter, index) => (
          <span key={index} className={css.letter} style={{ "--i": index } as CSSProperties}>
            {letter}
          </span>
        ))}
      </span>
    </span>
  );
}
