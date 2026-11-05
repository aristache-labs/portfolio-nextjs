"use client";

import type { MouseEvent } from "react";
import { cn } from "@/utils/cn";
import type { MenuSection } from "./SiteNav";
import styles from "./nav-chapter-rail.module.css";

type NavChapterRailProps = {
  sections: MenuSection[];
  numbers: Partial<Record<string, string>>;
  active: string | null;
  /** The rail appears once the page has scrolled past the hero. */
  visible: boolean;
  onSelect: (event: MouseEvent<HTMLAnchorElement>, id: string) => void;
  hrefFor: (id: string) => string;
};

/**
 * Desktop chapter rail: one dot per section on the right edge. The active chapter grows into a
 * numbered bar and every dot names its section on hover or keyboard focus. Hidden below xl,
 * where the header menu and its section label do the same job.
 */
export function NavChapterRail({
  sections,
  numbers,
  active,
  visible,
  onSelect,
  hrefFor,
}: NavChapterRailProps) {
  return (
    <nav
      aria-label="Chapters"
      data-visible={visible ? "" : undefined}
      className={cn(styles.rail, "fixed top-1/2 right-4 z-40 hidden xl:block")}
    >
      <ul className={styles.list}>
        {sections.map((section) => {
          const isActive = section.id === active;
          return (
            <li key={section.id}>
              <a
                href={hrefFor(section.id)}
                onClick={(event) => onSelect(event, section.id)}
                aria-current={isActive ? "location" : undefined}
                tabIndex={visible ? undefined : -1}
                className={cn(styles.item, isActive && styles.active)}
              >
                <span className={styles.label}>
                  <span className={styles.number}>{numbers[section.id] ?? "00"}</span>
                  {section.label}
                </span>
                <span aria-hidden className={styles.dot} />
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
