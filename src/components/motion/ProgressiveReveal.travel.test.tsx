import { act, cleanup, render } from "@testing-library/react";
import { forwardRef, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProgressiveReveal } from "./ProgressiveReveal";
import { beginSectionNavigation } from "@/lib/section-navigation";

const controls = vi.hoisted(() => ({ set: vi.fn(), start: vi.fn(), stop: vi.fn() }));
vi.mock("framer-motion", () => ({
  animate: vi.fn(() => ({ stop: vi.fn() })),
  useAnimationControls: () => controls,
  m: {
    div: forwardRef<HTMLDivElement, { children: ReactNode; className?: string }>(
      function MockMotionDiv({ children, className }, ref) {
        return (
          <div ref={ref} className={className}>
            {children}
          </div>
        );
      },
    ),
  },
}));

let deliveries: Map<Element, IntersectionObserverCallback>;

const intersect = (node: Element, top: number, isIntersecting: boolean) =>
  act(() =>
    deliveries.get(node)!(
      [
        {
          target: node,
          isIntersecting,
          boundingClientRect: { top, bottom: top + 200 },
        } as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    ),
  );

beforeEach(() => {
  vi.clearAllMocks();
  deliveries = new Map();
  controls.start.mockResolvedValue(undefined);
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private callback: IntersectionObserverCallback) {}
      observe(target: Element) {
        deliveries.set(target, this.callback);
      }
      disconnect = vi.fn();
    },
  );
  vi.stubGlobal("innerHeight", 800);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    top: 2000,
    bottom: 2200,
  } as DOMRect);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function setup() {
  const { container } = render(
    <>
      <section id="middle">
        <ProgressiveReveal>Middle</ProgressiveReveal>
      </section>
      <section id="destination" />
    </>,
  );
  const [middle, destination] = container.querySelectorAll("section");
  return { node: middle.firstElementChild as HTMLElement, destination };
}

describe("ProgressiveReveal while a section jump travels", () => {
  it("does not start an entrance for a section the jump only passes through", () => {
    const { node, destination } = setup();
    const finish = beginSectionNavigation(destination);
    intersect(node, 300, true);
    expect(controls.start).not.toHaveBeenCalled();
    finish(true);
  });

  it("starts it when the jump lands with the element on screen", () => {
    const { node, destination } = setup();
    const finish = beginSectionNavigation(destination);
    intersect(node, 300, true);
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue({
      top: 100,
      bottom: 300,
    } as DOMRect);
    act(() => finish(true));
    expect(controls.start).toHaveBeenCalledTimes(1);
  });

  it("keeps an element above the landing prepared instead of finishing it unseen", () => {
    const { node, destination } = setup();
    const finish = beginSectionNavigation(destination);
    intersect(node, -600, false);
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue({
      top: -600,
      bottom: -400,
    } as DOMRect);
    controls.set.mockClear();
    act(() => finish(true));
    act(() => window.dispatchEvent(new Event("scrollend")));
    expect(controls.start).not.toHaveBeenCalled();
    expect(controls.set).not.toHaveBeenCalled();
    // Its first real visit, scrolling back up, still plays the entrance.
    intersect(node, -50, true);
    expect(controls.start).toHaveBeenCalledTimes(1);
  });

  it("still finishes content skipped by an ordinary fast scroll", () => {
    const { node } = setup();
    intersect(node, -600, false);
    expect(controls.set).toHaveBeenCalled();
    expect(controls.start).not.toHaveBeenCalled();
  });
});
