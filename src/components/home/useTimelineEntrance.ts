"use client";

import type { RefObject } from "react";
import { useEntranceOnce } from "@/hooks/useEntranceOnce";

/**
 * Marks the timeline `data-spine="armed"` until it first comes properly into view, then `"play"`
 * for one entrance and `"done"`. CSS hides the rail lines and the dots while armed and lets them
 * vanish in on play (experience-layout.module.css). The state is dropped after the entrance so the
 * rail fill, which mounts and unmounts as the list nears the screen, never replays it.
 */
export function useTimelineEntrance(listRef: RefObject<HTMLDivElement | null>, enabled: boolean) {
  useEntranceOnce(listRef, enabled, "spine");
}
