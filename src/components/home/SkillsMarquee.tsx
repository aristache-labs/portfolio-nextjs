"use client";

import { useEffect, useRef } from "react";
import { MOBILE_REVEAL_DEPTH, revealInset } from "@/lib/reveal-depth";
import { createTravelGate } from "@/lib/section-navigation";
import styles from "./skills-marquee.module.css";

type MarqueeSkill = { name: string; iconPath: string };

/**
 * Slow, endless strip of every tool's logo under the filterable grid. Purely decorative: the
 * grid above already names and rates each skill, so the strip is hidden from assistive tech and
 * from reduced-motion visitors. The slot keeps its height before the icons load, so nothing
 * shifts when they arrive. The group repeats twice and the track slides exactly one group, which
 * makes the loop seamless.
 */
export function SkillsMarquee({
  skills,
  loadIcons,
}: {
  skills: MarqueeSkill[];
  loadIcons: boolean;
}) {
  const slot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = slot.current;
    if (!node || !loadIcons || skills.length === 0) return;
    if (
      typeof IntersectionObserver !== "function" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    node.dataset.entrance = "armed";
    // Slides up once, on the first visit, when it is properly on screen and not merely touching the
    // bottom edge. A section jump that only passes through must not spend it unseen.
    const inset = revealInset(MOBILE_REVEAL_DEPTH);
    const show = () => {
      node.dataset.entrance = "visible";
      observer.disconnect();
    };
    const gate = createTravelGate(node, show, inset);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry || gate.passing()) return;
        if (entry.isIntersecting) show();
      },
      { rootMargin: `0px 0px -${inset}px 0px` },
    );
    observer.observe(node);
    return () => {
      gate.dispose();
      observer.disconnect();
      // A cancelled observer must never leave the strip hidden.
      if (node.dataset.entrance === "armed") delete node.dataset.entrance;
    };
  }, [loadIcons, skills.length]);

  if (skills.length === 0) return null;
  return (
    <div ref={slot} aria-hidden className={styles.marquee}>
      {loadIcons && (
        <div className={styles.entrance}>
          <div className={styles.track}>
            {[0, 1].map((copy) => (
              <ul key={copy} className={styles.group}>
                {skills.map((skill) => (
                  <li key={skill.name} className={styles.tile}>
                    {/* Same tile and unoptimized SVG as the cards; lazy so it never beats the poster. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={skill.iconPath}
                      alt=""
                      width={28}
                      height={28}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
