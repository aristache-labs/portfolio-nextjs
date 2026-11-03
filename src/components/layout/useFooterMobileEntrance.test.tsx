import { StrictMode, useRef } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFooterMobileEntrance } from "./useFooterMobileEntrance";

const scroll = vi.hoisted(() => ({
  y: null as import("framer-motion").MotionValue<number> | null,
}));
vi.mock("framer-motion", async (original) => {
  const actual = await original<typeof import("framer-motion")>();
  return {
    ...actual,
    useScroll: () => {
      scroll.y = actual.useMotionValue(0);
      return { scrollY: scroll.y };
    },
  };
});

const observers = new Map<Element, IntersectionObserverCallback>();

function Harness({ enabled = true }: { enabled?: boolean }) {
  const footer = useRef<HTMLElement>(null);
  useFooterMobileEntrance(footer, enabled);
  return (
    <footer ref={footer}>
      <div data-footer-part="explore">
        <nav>
          <ul>
            <li>
              <a href="#about">About</a>
            </li>
          </ul>
        </nav>
      </div>
      <div data-footer-part="bar">Copyright</div>
    </footer>
  );
}

beforeEach(() => {
  observers.clear();
  vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(innerHeight + 1000);
  Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private callback: IntersectionObserverCallback) {}
      observe(target: Element) {
        observers.set(target, this.callback);
      }
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("mobile footer entrance", () => {
  it("reveals groups independently in Strict Mode", () => {
    const { container } = render(
      <StrictMode>
        <Harness />
      </StrictMode>,
    );
    const parts = container.querySelectorAll("[data-footer-part]");
    act(() =>
      observers.get(parts[0])!(
        [{ target: parts[0], isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    );
    expect(parts[0]).toHaveAttribute("data-footer-reveal", "play");
    expect(parts[1]).toHaveAttribute("data-footer-reveal", "armed");
  });

  it("settles a focused group without replaying queued intersections", () => {
    render(<Harness />);
    const link = screen.getByRole("link");
    const part = link.closest("[data-footer-part]")!;
    fireEvent.focusIn(link);
    act(() =>
      observers.get(part)!(
        [{ target: part, isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    );
    expect(part).toHaveAttribute("data-footer-reveal", "static");
  });

  it("shows copyright and all other groups completely at the page end", () => {
    const { container } = render(<Harness />);
    Object.defineProperty(window, "scrollY", { configurable: true, value: 1000 });
    act(() => scroll.y!.set(1000));
    container.querySelectorAll("[data-footer-part]").forEach((part) => {
      expect(part).toHaveAttribute("data-footer-reveal", "static");
    });
  });

  it("leaves everything visible when disabled", () => {
    const { container } = render(<Harness enabled={false} />);
    expect(container.querySelector("[data-footer-reveal]")).toBeNull();
    expect(observers.size).toBe(0);
  });
});
