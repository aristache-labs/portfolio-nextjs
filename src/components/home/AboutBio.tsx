"use client";

import { useId, useRef, useState } from "react";
import { useMobileSectionReset } from "@/hooks/useMobileSectionReset";
import { ChevronDown } from "lucide-react";
import styles from "./about-bio.module.css";
import { AboutReveal } from "./AboutReveal";

const END = "technical challenges into practical, dependable solutions.";

/**
 * Each word is its own box, so CSS can light it up as it reaches the reading line
 * (about-bio.module.css). Spaces stay plain text, so wrapping and copy-paste are unchanged.
 */
function ReadingWords({ text }: { text: string }) {
  return text.split(/(\s+)/).map((part, index) =>
    /^\s+$/.test(part) || !part ? (
      part
    ) : (
      <span key={index} className={styles.word}>
        {part}
      </span>
    ),
  );
}

const PARAGRAPH = "text-base leading-relaxed text-white sm:text-lg";

function split(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/**
 * The biography is rendered once. Desktop shows all of it; phones show the introduction and keep
 * the rest behind "Read more". A cut inside a paragraph keeps that paragraph whole on desktop and
 * lets its tail open as a paragraph of its own on phones.
 */
export function AboutBio({ bio }: { bio: string }) {
  const [expanded, setExpanded] = useState(false);
  const bioRef = useRef<HTMLDivElement>(null);
  useMobileSectionReset(bioRef, expanded, () => setExpanded(false));
  const id = useId();
  const tailId = `${id}-tail`;
  const match = bio.toLowerCase().indexOf(END);
  const firstParagraph = bio.search(/\n\s*\n/);
  const cut = match >= 0 ? match + END.length : firstParagraph >= 0 ? firstParagraph : bio.length;
  const intro = split(bio.slice(0, cut));
  const rest = split(bio.slice(cut));
  // The cut fell inside a paragraph when no blank line separates the two halves.
  const tail = rest.length > 0 && !/^\s*\n\s*\n/.test(bio.slice(cut)) ? rest.shift() : undefined;

  const collapsed = !expanded || undefined;
  const restIds = rest.map((_, index) => `${id}-${index}`);

  return (
    <>
      {/* Paragraphs stay direct children: the desktop About layout sets them in two columns
      (about-stats.module.css). Top margins, so a collapsed paragraph leaves no gap behind it.
      Every paragraph reads in to full white; the reading light dims what is still ahead. */}
      <div ref={bioRef} className="[&>p+p]:mt-4">
        {intro.map((paragraph, index) => (
          <p key={index} className={PARAGRAPH}>
            <ReadingWords text={paragraph} />
            {tail && index === intro.length - 1 && (
              // Collapsed on phones only (about-bio.module.css); desktop keeps it in the paragraph.
              <span id={tailId} data-collapsed={collapsed} className={styles.tail}>
                {" "}
                <ReadingWords text={tail} />
              </span>
            )}
          </p>
        ))}
        {rest.map((paragraph, index) => (
          <p
            key={index}
            id={restIds[index]}
            data-collapsed={collapsed}
            className={`${styles.remainder} ${PARAGRAPH}`}
          >
            <ReadingWords text={paragraph} />
          </p>
        ))}
      </div>
      {(tail || rest.length > 0) && (
        <>
          <AboutReveal className={styles.buttonReveal}>
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={[...(tail ? [tailId] : []), ...restIds].join(" ")}
              onClick={() => setExpanded((value) => !value)}
              className={`${styles.toggle} text-brand-bright border-brand-mid/30 hover:bg-brand-mid/10 focus-visible:ring-brand-mid/70 mx-auto mt-5 flex min-h-11 w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none`}
            >
              {expanded ? "Show less" : "Read more"}
              <ChevronDown
                aria-hidden
                className={`size-4 transition-transform duration-200 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          </AboutReveal>
        </>
      )}
    </>
  );
}
