"use client";

import type { MouseEventHandler } from "react";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { pushedLabel, type ProjectPresentation } from "@/lib/project-presentation";
import { ProjectsArrival } from "./ProjectsArrival";
import { COMPACT_PROJECT_ACTION, GLASS_CARD, PRIMARY_TAG } from "./project-styles";
import motionStyles from "./project-motion.module.css";
import styles from "./currently-building.module.css";

/**
 * Small card beside the section heading: what is being worked on right now. The project and its
 * last push date come from the cached GitHub data the section already loads, so it adds no
 * request. Three rows: label and date on top, the title on its own line, and the language badge
 * with the View button at the bottom, so every edge lines up.
 */
export function CurrentlyBuilding({
  project,
  onQuickView,
}: {
  project: ProjectPresentation;
  onQuickView: MouseEventHandler<HTMLButtonElement>;
}) {
  if (!project.pushedAt) return null;
  return (
    <ProjectsArrival
      kind="recent"
      effect="slide-from-right"
      duration={0.7}
      delay={0.25}
      className={styles.slot}
    >
      {/* Keep the shared card styling while the solid surface slides into place. */}
      <div className={`${GLASS_CARD} ${motionStyles.card} ${styles.card} rounded-2xl border`}>
        <p className={styles.label}>
          <span aria-hidden className={styles.dot} />
          Building now
        </p>
        <time className={styles.date} dateTime={project.pushedAt.toISOString()}>
          {pushedLabel(project.pushedAt)}
        </time>
        <p className={`${styles.title} font-display`}>{project.title}</p>
        {project.language && (
          <span className={`${PRIMARY_TAG} ${styles.tag}`}>{project.language}</span>
        )}
        <Button
          size="sm"
          className={`${COMPACT_PROJECT_ACTION} ${styles.action}`}
          onClick={onQuickView}
          aria-label={`Open ${project.title}, building now`}
          leftIcon={<Maximize2 className="size-3.5" aria-hidden />}
        >
          View
        </Button>
      </div>
    </ProjectsArrival>
  );
}
