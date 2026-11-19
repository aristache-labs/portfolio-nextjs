import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { SpringCount } from "@/components/motion/SpringCount";
import type { AboutStat } from "@/lib/about-stats";
import { AboutReveal } from "./AboutReveal";
import statsCss from "./about-stats.module.css";
import styles from "./about-milestones.module.css";

type Milestone = AboutStat & { icon: LucideIcon };

/** Dotted elbow from a card's centre out to the gap before the next card. */
function Connector({ down }: { down: boolean }) {
  return (
    <svg
      aria-hidden
      className={`${styles.connector} ${down ? styles.connectorDown : styles.connectorUp}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <path d={down ? "M 0 0 V 100 H 100" : "M 0 100 V 0 H 100"} />
    </svg>
  );
}

/**
 * The About results as a staggered row of milestone cards: odd cards sit lower, dotted elbows
 * lead from each card toward the next, and the last card is highlighted with a live dot.
 */
export function AboutMilestones({ items }: { items: Milestone[] }) {
  const last = items.length - 1;
  return (
    <AboutReveal className={styles.track}>
      <ol className={styles.list}>
        {items.map(({ key, icon: Icon, value, label }, index) => {
          const lowered = index % 2 === 1;
          return (
            <li
              key={key}
              className={`${styles.step} ${lowered ? styles.lowered : ""}`}
              style={{ "--i": index } as CSSProperties}
            >
              <div
                className={`${styles.card} ${statsCss.glass} ${index === last ? styles.featured : ""}`}
              >
                <span className={styles.metric}>
                  <Icon aria-hidden className={styles.icon} strokeWidth={1.75} />
                  <span className={`${styles.value} font-display`}>
                    <SpringCount value={value} />
                  </span>
                </span>
                <span className={styles.label}>{label}</span>
              </div>
              {index < last ? (
                <Connector down={!lowered} />
              ) : (
                <span aria-hidden className={styles.end}>
                  <span className={styles.endDot} />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </AboutReveal>
  );
}
