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

function Paragraphs({ text }: { text: string }) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => (
      <p
        key={index}
        // Every paragraph reads in to full white; the reading light dims what is still ahead.
        className="text-base leading-relaxed text-white sm:text-lg"
      >
        <ReadingWords text={paragraph} />
      </p>
    ));
}

export function AboutBio({ bio }: { bio: string }) {
  const [expanded, setExpanded] = useState(false);
  const mobileRef = useRef<HTMLDivElement>(null);
  useMobileSectionReset(mobileRef, expanded, () => setExpanded(false));
  const id = useId();
  const match = bio.toLowerCase().indexOf(END);
  const firstParagraph = bio.search(/\n\s*\n/);
  const cut = match >= 0 ? match + END.length : firstParagraph >= 0 ? firstParagraph : bio.length;
  const intro = bio.slice(0, cut).trim();
  const remaining = bio.slice(cut).trim();

  return (
    <>
      <div className={`${styles.desktop} space-y-4`}>
        <Paragraphs text={bio} />
      </div>
      <div ref={mobileRef} className={styles.mobile}>
        <div className="space-y-4">
          <Paragraphs text={intro} />
        </div>
        {remaining && (
          <>
            <div id={id} hidden={!expanded} className={`${styles.remainder} mt-4 space-y-4`}>
              <Paragraphs text={remaining} />
            </div>
            <AboutReveal className={styles.buttonReveal}>
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={id}
                onClick={() => setExpanded((value) => !value)}
                className={`${styles.toggle} text-brand-bright border-brand-mid/30 hover:bg-brand-mid/10 focus-visible:ring-brand-mid/70 mx-auto mt-5 flex min-h-11 w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none`}
              >
                {expanded ? "View less" : "View more"}
                <ChevronDown
                  aria-hidden
                  className={`size-4 transition-transform duration-200 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
                />
              </button>
            </AboutReveal>
          </>
        )}
      </div>
    </>
  );
}
