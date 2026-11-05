"use client";

import type { MouseEventHandler } from "react";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { pushedLabel, type ProjectPresentation } from "@/lib/project-presentation";
import { ProjectsArrival } from "./ProjectsArrival";
import { COMPACT_PROJECT_ACTION, GLASS_CARD } from "./project-styles";
import styles from "./currently-building.module.css";

/**
 * Slim "what I am working on right now" strip above the showcase. The project and its push date
 * come from the cached GitHub data the section already loads, so it adds no request. A live dot
 * says the repo is active; the date is the repo's last push, never a claim about today.
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
      effect="fade-from-right"
      duration={0.7}
      delay={0.25}
      className={styles.slot}
    >
      <div className={`${GLASS_CARD} ${styles.strip} rounded-2xl border`}>
        <p className={styles.label}>
          <span aria-hidden className={styles.dot} />
          Currently building
        </p>
        <p className={styles.title}>{project.title}</p>
        <p className={styles.meta}>
          {project.language && <span>{project.language}</span>}
          <span>Last push {pushedLabel(project.pushedAt)}</span>
        </p>
        <Button
          size="sm"
          className={`${COMPACT_PROJECT_ACTION} ${styles.action}`}
          onClick={onQuickView}
          aria-label={`Open ${project.title}, currently building`}
          leftIcon={<Maximize2 className="size-3.5" aria-hidden />}
        >
          View
        </Button>
      </div>
    </ProjectsArrival>
  );
}
