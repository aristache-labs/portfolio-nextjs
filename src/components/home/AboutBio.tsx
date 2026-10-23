"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./about-bio.module.css";

const END = "technical challenges into practical, dependable solutions.";

function Paragraphs({ text }: { text: string }) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => (
      <p
        key={index}
        className={
          index === 0
            ? "text-base leading-relaxed text-white sm:text-lg"
            : "text-base leading-relaxed text-white/60 sm:text-lg"
        }
      >
        {paragraph}
      </p>
    ));
}

export function AboutBio({ bio }: { bio: string }) {
  const [expanded, setExpanded] = useState(false);
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
      <div className={styles.mobile}>
        <div className="space-y-4">
          <Paragraphs text={intro} />
        </div>
        {remaining && (
          <>
            <div id={id} hidden={!expanded} className={`${styles.remainder} mt-4 space-y-4`}>
              <Paragraphs text={remaining} />
            </div>
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
          </>
        )}
      </div>
    </>
  );
}
