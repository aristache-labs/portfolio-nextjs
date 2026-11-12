type Listener = (pending: boolean) => void;
const listeners = new Set<{ node: () => HTMLElement | null; notify: Listener }>();
let destination: HTMLElement | null = null;
const completionListeners = new Set<(target: HTMLElement, arrived: boolean) => void>();

export function sectionNavigationInProgress() {
  return destination !== null;
}

export function subscribeSectionNavigationComplete(
  listener: (target: HTMLElement, arrived: boolean) => void,
) {
  completionListeners.add(listener);
  return () => {
    completionListeners.delete(listener);
  };
}

export function sectionNavigationPending(node: HTMLElement) {
  return !!destination?.contains(node);
}

/**
 * True while a section jump is travelling and `node` is not in the destination: it is a section
 * the page is only passing through. Its entrance must not start, load or measure on the way, or a
 * long jump fires every animation at once. It plays on the first real visit instead.
 */
export function sectionTravelSkips(node: HTMLElement) {
  return destination !== null && !destination.contains(node);
}

/**
 * For one-shot reveal observers. `passing()` says a jump is only travelling through `node`, so the
 * reveal must wait. `skipped` then stays true, so the observer does not finish the element unseen
 * when it ends up above the screen. When the jump lands with the element on screen, `onLanded`
 * starts its entrance, since the observer will not report it again. Call `dispose` on cleanup.
 */
export function createTravelGate(node: HTMLElement, onLanded: () => void, inset = 0) {
  let skipped = false;
  const stop = subscribeSectionNavigationComplete(() => {
    if (!skipped) return;
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight - inset && rect.bottom > 0) {
      skipped = false;
      onLanded();
    }
  });
  return {
    passing() {
      if (!sectionTravelSkips(node)) return false;
      skipped = true;
      return true;
    },
    isSkipped: () => skipped,
    clear() {
      skipped = false;
    },
    dispose: stop,
  };
}

export function subscribeSectionNavigation(node: () => HTMLElement | null, notify: Listener) {
  const listener = { node, notify };
  listeners.add(listener);
  const current = node();
  if (current && sectionNavigationPending(current)) notify(true);
  return () => {
    listeners.delete(listener);
  };
}

/** Explicit completion belongs to our scroll driver, not the browser's per-frame scrollend. */
export function beginSectionNavigation(target: HTMLElement) {
  destination = target;
  for (const listener of listeners) {
    const node = listener.node();
    if (node && target.contains(node)) listener.notify(true);
  }
  let finished = false;
  return (arrived = true) => {
    if (finished) return;
    finished = true;
    if (destination === target) destination = null;
    for (const listener of listeners) {
      const node = listener.node();
      if (node && target.contains(node)) listener.notify(false);
    }
    completionListeners.forEach((listener) => listener(target, arrived));
  };
}
