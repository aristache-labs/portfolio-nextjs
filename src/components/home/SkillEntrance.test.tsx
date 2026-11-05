import { StrictMode, useContext, useEffect } from "react";
import { LazyMotion, domMax } from "framer-motion";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RevealSequence, type RevealPhase } from "@/components/motion/RevealSequence";
import { REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { installMatchMedia } from "@/test/matchMedia";
import { SkillEntrance } from "./SkillEntrance";

const phases: RevealPhase[] = [];
let notify: IntersectionObserverCallback;

function Content() {
  const sequence = useContext(RevealSequence);
  useEffect(() => sequence?.subscribe((phase) => phases.push(phase)), [sequence]);
  return <button>Card content</button>;
}

function Card() {
  return (
    <StrictMode>
      <LazyMotion features={domMax}>
        <SkillEntrance mobile filtered={false}>
          <Content />
        </SkillEntrance>
      </LazyMotion>
    </StrictMode>
  );
}

beforeEach(() => {
  phases.length = 0;
  installMatchMedia();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        notify = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("mobile SkillEntrance", () => {
  it("restores cards in their final state after an automatic offscreen reset", () => {
    render(
      <LazyMotion features={domMax}>
        <SkillEntrance mobile filtered={false} skipEntrance>
          <Content />
        </SkillEntrance>
      </LazyMotion>,
    );
    expect(phases.at(-1)).toBe("static");
    expect(phases).not.toContain("prepared");
  });

  it("waits for its own intersection and publishes completion after the entrance", async () => {
    const { unmount } = render(<Card />);
    expect(phases.at(-1)).toBe("prepared");
    const emit = (ratio: number) =>
      act(() => {
        notify(
          [
            {
              isIntersecting: true,
              intersectionRatio: ratio,
              boundingClientRect: { bottom: 400 },
            } as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver,
        );
      });
    emit(0.05);
    expect(phases.at(-1)).toBe("prepared");
    emit(0.2);
    expect(phases.at(-1)).toBe("prepared");
    await waitFor(() => expect(phases.at(-1)).toBe("complete"), { timeout: 2000 });
    // Strict Mode and unmount must not call controls.set() after controls are detached.
    expect(() => unmount()).not.toThrow();
  });

  it("reveals a focused card immediately", () => {
    render(<Card />);
    fireEvent.focusIn(screen.getByRole("button"));
    expect(phases.at(-1)).toBe("static");
  });

  it("keeps content and percentages static with reduced motion", () => {
    installMatchMedia({ [REDUCED_MOTION_QUERY]: true });
    render(<Card />);
    expect(phases.at(-1)).toBe("static");
  });
});
