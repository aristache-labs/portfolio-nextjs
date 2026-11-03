/** Where `value` sits between `start` and `end`, clamped to 0..1. */
export const phaseProgress = (value: number, start: number, end: number) =>
  Math.max(0, Math.min(1, (value - start) / (end - start)));

/** Eases a 0..1 phase so scroll-driven motion starts and settles softly. */
export const smoothstep = (phase: number) => phase * phase * (3 - 2 * phase);
