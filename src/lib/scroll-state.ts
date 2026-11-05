/**
 * The one scroll and resize loop for site chrome. The header, the scroll-to-top button, the
 * scroll spy and the hero video all used to attach their own window listeners; they now share
 * a single passive pair that fires subscribers once per animation frame.
 */
type Listener = () => void;

const listeners = new Set<Listener>();
let frame = 0;
let attached = false;

const flush = () => {
  frame = 0;
  listeners.forEach((listener) => listener());
};

const schedule = () => {
  if (!frame) frame = requestAnimationFrame(flush);
};

const attach = () => {
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  attached = true;
};

const detach = () => {
  window.removeEventListener("scroll", schedule);
  window.removeEventListener("resize", schedule);
  cancelAnimationFrame(frame);
  frame = 0;
  attached = false;
};

/** Calls `listener` at most once per frame while the page scrolls or resizes. */
export function subscribeScroll(listener: Listener): () => void {
  listeners.add(listener);
  if (!attached) attach();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && attached) detach();
  };
}
