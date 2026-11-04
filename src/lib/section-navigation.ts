type Listener = (pending: boolean) => void;
const listeners = new Set<{ node: () => HTMLElement | null; notify: Listener }>();
let destination: HTMLElement | null = null;

export function sectionNavigationPending(node: HTMLElement) {
  return !!destination?.contains(node);
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
  return () => {
    if (finished) return;
    finished = true;
    if (destination === target) destination = null;
    for (const listener of listeners) {
      const node = listener.node();
      if (node && target.contains(node)) listener.notify(false);
    }
  };
}
