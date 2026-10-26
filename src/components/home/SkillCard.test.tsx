import { act, cleanup, render, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { EXPRESSIVE_MOTION_QUERY, REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { installMatchMedia } from "@/test/matchMedia";
import { SkillCard } from "./SkillCard";
import { SkillEntrance } from "./SkillEntrance";
import { createRevealSequence, RevealSequence } from "@/components/motion/RevealSequence";
import type { ReactNode } from "react";

const progress = vi.hoisted(() => ({
  animate: vi.fn(),
  stop: vi.fn(),
  entranceComplete: undefined as (() => void) | undefined,
  entries: [] as ((definition: string) => void)[],
}));
vi.mock("framer-motion", async (original) => {
  const { forwardRef } = await import("react");
  return {
    ...(await original<typeof import("framer-motion")>()),
    animate: progress.animate,
    m: {
      div: forwardRef<
        HTMLDivElement,
        {
          children: ReactNode;
          onAnimationComplete?: (definition: string) => void;
          variants?: unknown;
        }
      >(function MotionDiv({ children, onAnimationComplete, variants }, ref) {
        if (variants && onAnimationComplete) progress.entries.push(onAnimationComplete);
        else if (onAnimationComplete)
          progress.entranceComplete = () => onAnimationComplete("visible");
        return <div ref={ref}>{children}</div>;
      }),
    },
  };
});
let notify: IntersectionObserverCallback;
let target: Element;
const disconnect = vi.fn();
const card = (
  <SkillCard name="React" iconPath="/skills/react.svg" category="Development" level="Expert" />
);

beforeEach(() => {
  vi.clearAllMocks();
  progress.entries = [];
  installMatchMedia();
  progress.animate.mockReturnValue({ stop: progress.stop });
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        notify = callback;
      }
      observe(node: Element) {
        target = node;
      }
      disconnect = disconnect;
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function enter() {
  act(() =>
    notify(
      [{ target, isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    ),
  );
}

it("waits for a filtered card's own entrance even after the grid is visible", () => {
  const sequence = createRevealSequence();
  sequence.publish("complete");
  render(
    <RevealSequence.Provider value={sequence}>
      <SkillEntrance filtered>{card}</SkillEntrance>
    </RevealSequence.Provider>,
  );
  expect(screen.getByText("0%")).toBeInTheDocument();
  expect(progress.animate).not.toHaveBeenCalled();
  act(() => progress.entranceComplete!());
  expect(progress.animate).toHaveBeenCalledWith(0, 90, expect.objectContaining({ delay: 0 }));
});

it.each([
  [1440, 900, true],
  [390, 844, false],
  [844, 390, false],
])("keeps the percentage and fill synchronized at %sx%s", (width, height, desktop) => {
  installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: desktop });
  vi.stubGlobal("innerWidth", width);
  vi.stubGlobal("innerHeight", height);
  const { container, rerender, unmount } = render(card);
  const bar = screen.getByRole("progressbar", { name: "React proficiency" });
  const fill = bar.firstElementChild!;
  expect(fill).toHaveStyle({ width: "0%" });
  expect(screen.getByText("0%")).toHaveAttribute("aria-hidden");
  expect(bar).toHaveAttribute("aria-valuenow", "90");
  expect(progress.animate).not.toHaveBeenCalled();
  enter();
  expect(progress.animate).toHaveBeenCalledWith(
    0,
    90,
    expect.objectContaining({ duration: 1.3, delay: 0.4 }),
  );
  const animation = progress.animate.mock.calls[0][2];
  act(() => animation.onUpdate(45));
  expect(fill).toHaveStyle({ width: "45%" });
  expect(screen.getByText("45%")).toBeInTheDocument();
  act(() => animation.onComplete());
  expect(fill).toHaveStyle({ width: "90%" });
  expect(screen.getByText("90%")).toBeInTheDocument();
  enter();
  act(() => window.dispatchEvent(new Event("resize")));
  expect(progress.animate).toHaveBeenCalledTimes(1);
  installMatchMedia({ [REDUCED_MOTION_QUERY]: true });
  rerender(
    <SkillCard name="React" iconPath="/skills/react.svg" category="Development" level="Expert" />,
  );
  expect(progress.stop).toHaveBeenCalled();
  animation.onUpdate(20);
  expect(fill).toHaveStyle({ width: "90%" });
  expect(container.querySelector("[aria-live]")).toBeNull();
  unmount();
  expect(disconnect).toHaveBeenCalled();
});

it.each([false, true])(
  "serves final HTML and hydrates without mismatches (reduced=%s)",
  async (reduced) => {
    installMatchMedia({ [REDUCED_MOTION_QUERY]: reduced });
    const container = document.createElement("div");
    container.innerHTML = renderToString(card);
    expect(container.querySelector("[role='progressbar']")?.firstElementChild).toHaveStyle({
      width: "90%",
    });
    expect(container).toHaveTextContent("90%");
    document.body.append(container);
    const onRecoverableError = vi.fn();
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, card, { onRecoverableError });
      });
      expect(onRecoverableError).not.toHaveBeenCalled();
      if (reduced) {
        expect(container).toHaveTextContent("90%");
        expect(progress.animate).not.toHaveBeenCalled();
      } else {
        enter();
        expect(progress.animate).toHaveBeenCalledTimes(1);
      }
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  },
);
