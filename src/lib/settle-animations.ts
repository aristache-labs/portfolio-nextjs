/**
 * Runs `onSettled` once every time-based animation inside `node` (itself included) has finished.
 * Scroll-driven and infinite animations never finish, so they are ignored. A `both` fill keeps an animated
 * element on its own compositor layer for good; settling lets the caller swap the animation for
 * plain styles with the same end state, so the layer, and its memory, is released. Returns a
 * cancel function.
 */
export function settleWhenDone(node: HTMLElement, onSettled: () => void): () => void {
  if (typeof node.getAnimations !== "function") return () => {};
  let cancelled = false;
  const timed = node
    .getAnimations({ subtree: true })
    .filter(
      (animation) =>
        animation.timeline === document.timeline &&
        animation.effect?.getComputedTiming().iterations !== Infinity,
    );
  Promise.allSettled(timed.map((animation) => animation.finished)).then(() => {
    if (!cancelled) onSettled();
  });
  return () => {
    cancelled = true;
  };
}
