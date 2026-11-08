import styles from "./about-stats-glow.module.css";

/** Decorative inner glow; the statistics panel owns the layout and corner radius. */
export function AboutStatsGlow() {
  return <div aria-hidden="true" className={styles.glow} />;
}
