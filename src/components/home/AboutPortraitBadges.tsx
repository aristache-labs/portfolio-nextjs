import { Github } from "lucide-react";
import { IconTile, ICON_PROPS } from "@/components/ui/IconTile";
import { AboutReveal } from "./AboutReveal";
import styles from "./about-portrait-badges.module.css";

/**
 * Glass cards that float on two corners of the About portrait. Rendered as <p>, not <div>:
 * the About layout styles `.portrait > div > div` as the image frame.
 */
export function AboutPortraitBadges({
  repos,
  stars,
  availability,
}: {
  repos: number;
  stars: number;
  availability?: string | null;
}) {
  const note = availability?.trim();
  if (repos <= 0 && !note) return null;

  return (
    <AboutReveal className={styles.layer}>
      {repos > 0 && (
        <p className={`${styles.badge} ${styles.github}`}>
          <IconTile size="sm" className="scale-[0.8]">
            <Github {...ICON_PROPS} />
          </IconTile>
          <span>
            <span className="block text-xs font-semibold text-white">GitHub</span>
            <span className="block text-[11px] text-white/75">
              {repos} repos · {stars} stars
            </span>
          </span>
        </p>
      )}
      {note && (
        <p className={`${styles.badge} ${styles.availability}`}>
          <IconTile size="sm" className="scale-[0.8]">
            <span aria-hidden className={styles.dot} />
          </IconTile>
          <span>
            <span className="block text-xs font-semibold text-white">Available</span>
            <span className="block text-[11px] text-white/75">{note}</span>
          </span>
        </p>
      )}
    </AboutReveal>
  );
}
