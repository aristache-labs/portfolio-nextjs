export const INTRO_DURATION = 5;
export const INTRO_COMMAND = "open portfolio";
export const INTRO_LINES = [
  "const adrian = {",
  '  infrastructure: "Build reliable systems",',
  '  automation: "Simplify repetitive work",',
  '  development: ["Web", "Mobile"],',
  "};",
  "Ready to explore.",
];

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};

// Fixed seeded jitter keeps typing deterministic and below 24 characters per second.
let seed = 37;
let typedAt = 0.4;
const keystrokes = Array.from(INTRO_COMMAND, (_, index) => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  typedAt += 1 / (18 + (seed / 4294967296) * 6) + (index === 4 ? 0.08 : 0);
  return typedAt;
});

/** Every visual derives from elapsed seconds, including out-of-order preview seeks. */
export function introFrame(time: number) {
  const t = Math.max(0, time);
  const exit = smooth((t - 4) / 1);
  return {
    command: INTRO_COMMAND.slice(0, keystrokes.filter((at) => t >= at).length),
    cursor: t < 1.45 && (t >= 0.4 || Math.floor(t / 0.53) % 2 === 0),
    lines: INTRO_LINES.map((_, index) => smooth((t - (1.5 + index * 0.27)) / 0.18)),
    windowOpacity: 1 - smooth((t - 3.65) / 0.8),
    windowY: -24 * exit,
    windowScale: 1 - 0.035 * exit,
    curtainOpacity: 1 - smooth((t - 3.5) / 1.5),
    curtainClip: exit * 100,
    finished: t >= INTRO_DURATION,
  };
}
