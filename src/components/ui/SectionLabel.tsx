"use client";

import { useRef, type ElementType } from "react";
import { useEntranceOnce } from "@/hooks/useEntranceOnce";
import labelCss from "./section-label.module.css";

/** The beam, plus the cool-down that follows it (see section-label.module.css). */
const BEAM_PLAY_MS = 2000;

/**
 * The "01 ABOUT" line above a section title. A laser runs under it once, the first time it comes
 * properly into view, lights the letters and leaves the separator behind.
 */
export function SectionLabel({
  number,
  name,
  className = "",
  as: Tag = "p",
  ...rest
}: {
  number: string;
  name: string;
  className?: string;
  as?: ElementType;
} & Record<string, unknown>) {
  const ref = useRef<HTMLElement>(null);
  useEntranceOnce(ref, true, "beam", BEAM_PLAY_MS);

  return (
    <Tag ref={ref} className={`${labelCss.label} ${className}`} {...rest}>
      <span className={labelCss.number}>{number}</span>
      <span>{name}</span>
      <span aria-hidden className={labelCss.rule} />
      <span aria-hidden className={labelCss.beam}>
        <span className={labelCss.number} data-beam-text={number} />
        <span data-beam-text={name} />
        <span className={labelCss.beamHead} />
      </span>
    </Tag>
  );
}
