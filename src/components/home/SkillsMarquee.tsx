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
  if (skills.length === 0) return null;
  return (
    <div aria-hidden className={styles.marquee}>
      {loadIcons && (
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
      )}
    </div>
  );
}
