import { cn } from "@/utils/cn";
import { HTMLAttributes, ReactNode } from "react";

type SectionProps = {
  id?: string;
  children?: ReactNode;
  className?: string;
  /** Full-bleed layer behind the container, usually a section video. */
  backdrop?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "id" | "className">;

export function Section({ id, children, className, backdrop, ...rest }: SectionProps) {
  return (
    <section
      id={id}
      className={cn("py-20 md:py-28", backdrop && "relative overflow-hidden", className)}
      {...rest}
    >
      {backdrop}
      <div data-scroll-anchor className={cn("site-container", backdrop && "relative z-10")}>
        {children}
      </div>
    </section>
  );
}

function HeadingTitle({
  title,
  accent,
  breakAfter,
}: {
  title: string;
  accent?: string;
  breakAfter?: string;
}) {
  const head = accent && title.endsWith(accent) ? title.slice(0, -accent.length) : title;
  const accentNode = accent && title.endsWith(accent) ? accent : null;
  const split = breakAfter && head.startsWith(breakAfter) ? breakAfter.length : -1;

  if (split < 0) {
    return (
      <>
        {head}
        {accentNode && <span className="gradient-text">{accentNode}</span>}
      </>
    );
  }

  return (
    <>
      {head.slice(0, split)}
      <br />
      {head.slice(split).trimStart()}
      {accentNode && <span className="gradient-text">{accentNode}</span>}
    </>
  );
}

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  /** Trailing words drawn in the brand gradient, as on the Skills heading. */
  accent?: string;
  /** Force a line break after this leading phrase. */
  breakAfter?: string;
  /** Keep the title on one line. */
  nowrap?: boolean;
  /** Menu index of the section (e.g. "02") - ties the header to the nav overlay numbering. */
  number?: string;
  /** Centered variant for centered sections (Contact, Support): no fill rule. */
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  accent,
  breakAfter,
  nowrap,
  number,
  align = "left",
  className,
}: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <div className={cn("mb-12", className)}>
      {eyebrow && (
        <p
          className={cn(
            "text-muted mb-4 flex items-center gap-4 font-mono text-xs tracking-[0.3em] uppercase",
            centered && "justify-center",
          )}
        >
          <span>
            {number && <span className="gradient-text mr-3 font-semibold">{number}</span>}
            {eyebrow}
          </span>
          {!centered && <span aria-hidden className="bg-border h-px flex-1" />}
        </p>
      )}
      <h2
        className={
          accent
            ? cn(
                "font-display text-[clamp(1.65rem,3.4vw,3.5rem)] leading-[1.05] font-extrabold tracking-tight",
                nowrap && "whitespace-nowrap",
              )
            : "text-4xl font-extrabold tracking-tight text-balance md:text-5xl"
        }
      >
        <HeadingTitle title={title} accent={accent} breakAfter={breakAfter} />
      </h2>
    </div>
  );
}
