import { scrollToPosition, sectionScrollPosition } from "./scroll-to-section";
import { beginSectionNavigation, sectionNavigationInProgress } from "./section-navigation";

/** How long the page has to stay still before it settles on a section. */
export const SNAP_IDLE_MS = 100;
/** How near (share of the viewport height) a section start has to be for the page to settle. */
export const SNAP_THRESHOLD_RATIO = 0.2;
/** The pull never reaches further than this many pixels, however tall the screen is. */
export const SNAP_MAX_DISTANCE = 200;
/** A glide this short reads as a settle, not as a jump. */
export const SNAP_DURATION_MS = 520;
/**
 * Touch screens: the finger and the momentum already carry the page, so the pull is shorter and
 * waits longer, and the glide is quicker. Phones also have less height to spare.
 */
export const SNAP_TOUCH_IDLE_MS = 140;
export const SNAP_TOUCH_THRESHOLD_RATIO = 0.16;
export const SNAP_TOUCH_MAX_DISTANCE = 150;
export const SNAP_TOUCH_DURATION_MS = 420;
/** Closer than this the page is already where it should be. */
const SNAP_MIN_DISTANCE = 2;

/** Sections in page order. The hero (top of the page) and the footer never pull. */
export const SNAP_SECTION_IDS = [
  "about",
  "skills",
  "experience",
  "projects",
  "services",
  "contact",
] as const;

export type SnapCandidate = { id: string; position: number };

/** The farthest a section start may be from the scroll position and still pull the page. */
export function snapDistance(viewportHeight: number, touch = false) {
  return touch
    ? Math.min(SNAP_TOUCH_MAX_DISTANCE, viewportHeight * SNAP_TOUCH_THRESHOLD_RATIO)
    : Math.min(SNAP_MAX_DISTANCE, viewportHeight * SNAP_THRESHOLD_RATIO);
}

/**
 * The section whose settled position is nearest to `scrollY`, but only when it is close enough to
 * pull and not already there. Anything farther away is the middle of a section or of a pinned
 * scene, which must keep scrolling freely.
 */
export function pickSnapTarget(
  candidates: SnapCandidate[],
  scrollY: number,
  viewportHeight: number,
  touch = false,
): SnapCandidate | null {
  const limit = snapDistance(viewportHeight, touch);
  let best: SnapCandidate | null = null;
  let bestDistance = Infinity;
  for (const candidate of candidates) {
    const distance = Math.abs(candidate.position - scrollY);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  if (!best || bestDistance <= SNAP_MIN_DISTANCE || bestDistance > limit) return null;
  return best;
}

/**
 * Settles the page on the nearest section start. Returns a cancel function, or null when there
 * is nothing to do (a jump is already running, or no section is near enough).
 */
export function settleOnNearestSection(touch = false): (() => void) | null {
  if (sectionNavigationInProgress()) return null;
  const candidates: SnapCandidate[] = [];
  const elements = new Map<string, HTMLElement>();
  for (const id of SNAP_SECTION_IDS) {
    const element = document.getElementById(id);
    // A section that has not rendered yet (zero height) has no real start to settle on.
    if (!element || element.getBoundingClientRect().height <= 0) continue;
    elements.set(id, element);
    candidates.push({ id, position: sectionScrollPosition(element) });
  }
  const target = pickSnapTarget(candidates, window.scrollY, window.innerHeight, touch);
  const element = target ? elements.get(target.id) : undefined;
  if (!target || !element) return null;

  const finish = beginSectionNavigation(element);
  return scrollToPosition(() => sectionScrollPosition(element), false, finish, {
    duration: touch ? SNAP_TOUCH_DURATION_MS : SNAP_DURATION_MS,
  });
}
