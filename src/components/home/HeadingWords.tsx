import { Fragment, type CSSProperties } from "react";
import headingCss from "./section-heading.module.css";

/** The words of a section heading, each one a step of the About entrance (see section-heading.module.css). */
export function HeadingWords({
  lead,
  accent,
  tail = "",
}: {
  lead: string;
  accent: string;
  tail?: string;
}) {
  const words = lead.split(" ");
  return (
    <>
      {words.map((word, index) => (
        <Fragment key={index}>
          <span className={headingCss.word} style={{ "--i": index } as CSSProperties}>
            {word}
          </span>{" "}
        </Fragment>
      ))}
      <span className={headingCss.word} style={{ "--i": words.length } as CSSProperties}>
        <span className={headingCss.accent}>{accent}</span>
        {tail}
      </span>
    </>
  );
}
