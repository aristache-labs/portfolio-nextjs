import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { installMatchMedia } from "@/test/matchMedia";
import { SkillsMarquee } from "./SkillsMarquee";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("SkillsMarquee entrance", () => {
  it("waits until half visible, then plays once and stays", () => {
    installMatchMedia();
    let notify!: IntersectionObserverCallback;
    const disconnect = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          notify = callback;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    const { container, unmount } = render(
      <SkillsMarquee skills={[{ name: "React", iconPath: "/skills/react.svg" }]} loadIcons />,
    );
    const strip = container.firstElementChild as HTMLElement;
    const emit = (ratio: number) =>
      notify(
        [{ isIntersecting: ratio > 0, intersectionRatio: ratio } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    expect(strip.dataset.entrance).toBe("armed");
    emit(0.2);
    expect(strip.dataset.entrance).toBe("armed");
    emit(0.8);
    expect(strip.dataset.entrance).toBe("visible");
    // It plays once: observing stops, so scrolling past again never replays the entrance.
    expect(disconnect).toHaveBeenCalledOnce();
    unmount();
    expect(strip.dataset.entrance).toBe("visible");
  });
});
