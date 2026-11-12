import { act, cleanup, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installMatchMedia } from "@/test/matchMedia";
import { useTimelineEntrance } from "./useTimelineEntrance";

class FakeIO {
  static current: FakeIO | undefined;
  constructor(readonly callback: IntersectionObserverCallback) {
    FakeIO.current = this;
  }
  observe = vi.fn();
  disconnect = vi.fn();
  emit(entry: { isIntersecting: boolean; boundingClientRect: Partial<DOMRect> }) {
    act(() => this.callback([entry as IntersectionObserverEntry], this as never));
  }
}

function Harness() {
  const ref = useRef<HTMLDivElement>(null);
  useTimelineEntrance(ref, true);
  return <div ref={ref} data-testid="list" />;
}

const spine = (container: HTMLElement) => container.querySelector("div")!.dataset.spine;

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IntersectionObserver", FakeIO);
  vi.stubGlobal("innerHeight", 800);
  installMatchMedia();
  FakeIO.current = undefined;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useTimelineEntrance", () => {
  it("keeps the timeline hidden until it comes into view", () => {
    const { container } = render(<Harness />);
    expect(spine(container)).toBe("armed");
  });

  it("plays once when scrolled into view, then settles to done", () => {
    vi.stubGlobal("scrollY", 400);
    const { container } = render(<Harness />);
    FakeIO.current!.emit({
      isIntersecting: true,
      boundingClientRect: { height: 900, bottom: 700 },
    });
    expect(spine(container)).toBe("play");
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(spine(container)).toBe("done");
  });

  it("waits for the page to settle before believing an on-screen timeline at scroll 0", () => {
    vi.stubGlobal("scrollY", 0);
    const { container } = render(<Harness />);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      top: 2000,
      bottom: 2900,
    } as DOMRect);
    FakeIO.current!.emit({
      isIntersecting: true,
      boundingClientRect: { height: 900, bottom: 700 },
    });
    // Sections above were still loading when it briefly looked on screen: nothing is spent.
    expect(spine(container)).toBe("armed");
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(spine(container)).toBe("armed");
  });

  it("does not take an unrendered, empty box for a timeline that was scrolled past", () => {
    const { container } = render(<Harness />);
    FakeIO.current!.emit({ isIntersecting: false, boundingClientRect: { height: 0, bottom: 0 } });
    expect(spine(container)).toBe("armed");
  });

  it("does not spend the entrance on a timeline that really was scrolled past unseen", () => {
    const { container } = render(<Harness />);
    FakeIO.current!.emit({
      isIntersecting: false,
      boundingClientRect: { height: 900, bottom: -50 },
    });
    expect(spine(container)).toBe("done");
  });
});
