import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installMatchMedia } from "@/test/matchMedia";
import { REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { SectionLabel } from "./SectionLabel";

const originalObserver = globalThis.IntersectionObserver;
let notify: IntersectionObserverCallback;
let target: Element;

beforeEach(() => {
  installMatchMedia();
  // The entrance waits for the page to settle when it is first on screen at scroll 0.
  vi.spyOn(window, "scrollY", "get").mockReturnValue(100);
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        notify = callback;
      }
      observe(node: Element) {
        target = node;
      }
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.stubGlobal("IntersectionObserver", originalObserver);
});

const enter = () =>
  act(() =>
    notify(
      [{ target, isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    ),
  );

describe("SectionLabel", () => {
  it("is armed before it shows, plays once when it comes into view, then settles", () => {
    vi.useFakeTimers();
    const { container } = render(<SectionLabel number="02" name="Skills" />);
    const label = container.firstElementChild as HTMLElement;
    expect(label.dataset.beam).toBe("armed");
    enter();
    expect(label.dataset.beam).toBe("play");
    act(() => vi.advanceTimersByTime(2000));
    expect(label.dataset.beam).toBe("done");
    vi.useRealTimers();
  });

  it("reads once for assistive technology; the line and the beam copy are decoration", () => {
    const { container, getByText } = render(<SectionLabel number="03" name="Experience" />);
    expect(container).toHaveTextContent("03Experience");
    expect(getByText("Experience")).not.toHaveAttribute("aria-hidden");
    const decoration = [...container.querySelectorAll("[aria-hidden]")];
    expect(decoration).toHaveLength(2);
  });

  it("stays still, with the line already there, under reduced motion", () => {
    installMatchMedia({ [REDUCED_MOTION_QUERY]: true });
    const { container } = render(<SectionLabel number="04" name="Projects" />);
    expect((container.firstElementChild as HTMLElement).dataset.beam).toBeUndefined();
  });

  it("renders a div and the scroll anchor when asked", () => {
    const { container } = render(
      <SectionLabel as="div" data-scroll-anchor number="02" name="Skills" />,
    );
    const label = container.firstElementChild as HTMLElement;
    expect(label.tagName).toBe("DIV");
    expect(label).toHaveAttribute("data-scroll-anchor");
  });
});
