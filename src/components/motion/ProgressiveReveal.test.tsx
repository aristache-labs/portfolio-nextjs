import { act, cleanup, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { forwardRef, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProgressiveReveal } from "./ProgressiveReveal";
import { SpringCount } from "./SpringCount";
import { EXPRESSIVE_MOTION_QUERY, REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";

const controls = vi.hoisted(() => ({ set: vi.fn(), start: vi.fn(), stop: vi.fn() }));
const count = vi.hoisted(() => ({ animate: vi.fn(), stop: vi.fn() }));
vi.mock("framer-motion", () => ({
  animate: count.animate,
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

let deliver: IntersectionObserverCallback;
let matches: Record<string, boolean>;
let listeners: Set<() => void>;
const disconnect = vi.fn();
const observe = vi.fn();
const observerOptions = vi.fn();

function change(query: string, value: boolean) {
  act(() => {
    matches[query] = value;
    listeners.forEach((listener) => listener());
  });
}

function intersect(node: Element, top = 100, isIntersecting = true) {
  act(() =>
    deliver(
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
}

beforeEach(() => {
  vi.clearAllMocks();
  controls.start.mockResolvedValue(undefined);
  count.animate.mockReturnValue({ stop: count.stop });
  matches = {};
  listeners = new Set();
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: matches[query] ?? false,
    addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener),
  }));
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        deliver = callback;
        observerOptions(options);
      }
      observe = observe;
      disconnect = disconnect;
    },
  );
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    top: 2000,
  } as DOMRect);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("ProgressiveReveal", () => {
  it.each([
    [1440, 900, true],
    [390, 844, false],
    [844, 390, false],
  ])("starts all counters only after zoom completes at %sx%s", async (width, height, desktop) => {
    vi.stubGlobal("innerWidth", width);
    vi.stubGlobal("innerHeight", height);
    matches[EXPRESSIVE_MOTION_QUERY] = desktop;
    let complete!: () => void;
    controls.start.mockReturnValue(
      new Promise<void>((resolve) => {
        complete = resolve;
      }),
    );
    const { container } = render(
      <ProgressiveReveal effect="zoom">
        <SpringCount value="60%" />
        <SpringCount value="1,600+" />
      </ProgressiveReveal>,
    );
    expect(observe).toHaveBeenCalledTimes(1);
    expect(container.querySelectorAll("[aria-hidden]")[0]).toHaveTextContent("0%");
    intersect(container.firstElementChild!);
    expect(controls.start).toHaveBeenCalledTimes(1);
    expect(count.animate).not.toHaveBeenCalled();
    await act(async () => {
      complete();
    });
    expect(count.animate).toHaveBeenCalledTimes(2);
    expect(count.animate).toHaveBeenCalledWith(
      0,
      60,
      expect.objectContaining({ type: "spring", delay: 0 }),
    );
    expect(count.animate).toHaveBeenCalledWith(
      0,
      1600,
      expect.objectContaining({ type: "spring", delay: 0 }),
    );
    intersect(container.firstElementChild!);
    change(EXPRESSIVE_MOTION_QUERY, !desktop);
    expect(count.animate).toHaveBeenCalledTimes(2);
  });

  it("ignores late zoom completion after reduced motion interrupts it", async () => {
    let complete!: () => void;
    controls.start.mockReturnValue(
      new Promise<void>((resolve) => {
        complete = resolve;
      }),
    );
    const { container } = render(
      <ProgressiveReveal effect="zoom">
        <SpringCount value="60%" />
      </ProgressiveReveal>,
    );
    intersect(container.firstElementChild!);
    change(REDUCED_MOTION_QUERY, true);
    await act(async () => {
      complete();
    });
    expect(count.animate).not.toHaveBeenCalled();
    expect(container.querySelector("[aria-hidden]")).toHaveTextContent("60%");
  });

  it.each([false, true])("zooms metrics once without a vertical bounce (desktop=%s)", (desktop) => {
    matches[EXPRESSIVE_MOTION_QUERY] = desktop;
    const { container } = render(<ProgressiveReveal effect="zoom">Metrics</ProgressiveReveal>);
    intersect(container.firstElementChild!);
    expect(controls.start).toHaveBeenCalledWith({
      opacity: [0, 1],
      scale: [0.9, 1],
      transition: { duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] },
    });
    intersect(container.firstElementChild!);
    change(EXPRESSIVE_MOTION_QUERY, !desktop);
    expect(controls.start).toHaveBeenCalledTimes(1);
    expect(controls.set).toHaveBeenLastCalledWith({ opacity: 1, x: 0, y: 0, scale: 1 });
  });

  it("serves visible HTML and hydrates without mismatches", async () => {
    const content = <ProgressiveReveal className="metrics">Metrics</ProgressiveReveal>;
    const html = renderToString(content);
    expect(html).toBe('<div class="metrics">Metrics</div>');
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const onRecoverableError = vi.fn();
    let root: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, content, { onRecoverableError });
    });
    expect(onRecoverableError).not.toHaveBeenCalled();
    await act(async () => root.unmount());
    container.remove();
  });

  it.each([
    [false, 28, 1],
    [true, 38, 1],
  ])("uses the selected device profile (%s)", (desktop, distance, duration) => {
    matches[EXPRESSIVE_MOTION_QUERY] = desktop;
    const { container } = render(<ProgressiveReveal>Metrics</ProgressiveReveal>);
    expect(controls.set).toHaveBeenLastCalledWith({ opacity: 0, x: 0, y: 0 });
    intersect(container.firstElementChild!);
    expect(controls.start).toHaveBeenCalledWith({
      opacity: [0, 1],
      y: [distance, 0],
      transition: { duration, delay: 0.3, ease: [0.44, 2, 0.72, 2] },
    });
    expect(disconnect).toHaveBeenCalled();
    intersect(container.firstElementChild!);
    expect(controls.start).toHaveBeenCalledTimes(1);
    change(EXPRESSIVE_MOTION_QUERY, !desktop);
    expect(controls.set).toHaveBeenLastCalledWith({ opacity: 1, x: 0, y: 0 });
    expect(controls.start).toHaveBeenCalledTimes(1);
  });

  it("reveals content skipped by a fast scroll", () => {
    const { container } = render(<ProgressiveReveal>Metrics</ProgressiveReveal>);
    intersect(container.firstElementChild!, -300, false);
    expect(controls.start).not.toHaveBeenCalled();
    expect(controls.set).toHaveBeenLastCalledWith({ opacity: 1, x: 0, y: 0 });
  });

  it("waits beyond the screen edge before starting the entrance", () => {
    const { container } = render(<ProgressiveReveal>Metrics</ProgressiveReveal>);
    expect(observerOptions).toHaveBeenCalledWith({
      rootMargin: `0px 0px -${Math.min(120, Math.round(window.innerHeight * 0.15))}px 0px`,
    });
    intersect(container.firstElementChild!, window.innerHeight - 10, false);
    expect(controls.start).not.toHaveBeenCalled();
    expect(controls.set).toHaveBeenLastCalledWith({ opacity: 0, x: 0, y: 0 });
    intersect(container.firstElementChild!, window.innerHeight - 150);
    expect(controls.start).toHaveBeenCalledTimes(1);
  });

  it("restores skipped content after scrolling without continuous scroll calculations", () => {
    render(<ProgressiveReveal>Metrics</ProgressiveReveal>);
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockClear();
    act(() => window.dispatchEvent(new Event("scroll")));
    expect(HTMLElement.prototype.getBoundingClientRect).not.toHaveBeenCalled();
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue({
      top: -500,
    } as DOMRect);
    act(() => window.dispatchEvent(new Event("scrollend")));
    expect(controls.set).toHaveBeenLastCalledWith({ opacity: 1, x: 0, y: 0 });
    expect(controls.start).not.toHaveBeenCalled();
  });

  it("shows content immediately when keyboard focus reaches it", () => {
    const { getByRole } = render(
      <ProgressiveReveal>
        <button>View more</button>
      </ProgressiveReveal>,
    );
    act(() => getByRole("button").focus());
    expect(controls.set).toHaveBeenLastCalledWith({ opacity: 1, x: 0, y: 0 });
    expect(controls.start).not.toHaveBeenCalled();
  });

  it("finishes an active entrance immediately when a link receives focus", () => {
    const { container, getByRole } = render(
      <ProgressiveReveal>
        <a href="#contact">Contact</a>
      </ProgressiveReveal>,
    );
    intersect(container.firstElementChild!);
    expect(controls.start).toHaveBeenCalledTimes(1);
    act(() => getByRole("link").focus());
    expect(controls.stop).toHaveBeenCalled();
    expect(controls.set).toHaveBeenLastCalledWith({ opacity: 1, x: 0, y: 0 });
  });

  it.each([false, true])("slides headings horizontally on desktop=%s", (desktop) => {
    matches[EXPRESSIVE_MOTION_QUERY] = desktop;
    const { container } = render(<ProgressiveReveal effect="slide">Heading</ProgressiveReveal>);
    intersect(container.firstElementChild!);
    expect(controls.start).toHaveBeenCalledWith({
      opacity: [0, 1],
      x: [desktop ? -24 : -12, 0],
      transition: { duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] },
    });
    change(REDUCED_MOTION_QUERY, true);
    expect(controls.set).toHaveBeenLastCalledWith({ opacity: 1, x: 0, y: 0 });
  });

  it("fades biography without moving the text", () => {
    const { container } = render(<ProgressiveReveal effect="fade">Biography</ProgressiveReveal>);
    intersect(container.firstElementChild!);
    expect(controls.start).toHaveBeenCalledWith({
      opacity: [0, 1],
      transition: { duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] },
    });
  });

  it.each([false, true])(
    "slides the portrait from the right without changing opacity (desktop=%s)",
    (desktop) => {
      matches[EXPRESSIVE_MOTION_QUERY] = desktop;
      vi.stubGlobal("innerWidth", desktop ? 1440 : 390);
      const left = desktop ? 900 : 80;
      vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue({
        top: 2000,
        left,
      } as DOMRect);
      const distance = window.innerWidth - left + 24;
      const { container } = render(
        <ProgressiveReveal effect="slide-from-right">Portrait</ProgressiveReveal>,
      );
      expect(controls.set).toHaveBeenLastCalledWith({ opacity: 1, x: distance, y: 0 });
      intersect(container.firstElementChild!);
      expect(controls.start).toHaveBeenCalledWith({
        opacity: 1,
        x: [distance, 0],
        transition: { duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] },
      });
      intersect(container.firstElementChild!);
      expect(controls.start).toHaveBeenCalledTimes(1);
      change(REDUCED_MOTION_QUERY, true);
      expect(controls.set).toHaveBeenLastCalledWith({ opacity: 1, x: 0, y: 0 });
    },
  );

  it.each([
    [1440, 1000, true],
    [430, 250, false],
    [932, 650, false],
  ])("fades from beyond the right edge at width %s", (width, left, desktop) => {
    matches[EXPRESSIVE_MOTION_QUERY] = desktop;
    vi.stubGlobal("innerWidth", width);
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue({
      top: 2000,
      left,
    } as DOMRect);
    const { container } = render(
      <ProgressiveReveal effect="fade-from-right" duration={1.3} delay={0.4}>
        Quote
      </ProgressiveReveal>,
    );
    const distance = width - left + 24;
    expect(observe).toHaveBeenCalledWith(container.firstElementChild);
    expect(controls.set).toHaveBeenLastCalledWith({ opacity: 0, x: distance, y: 0 });
    intersect(container.firstElementChild!);
    expect(controls.start).toHaveBeenCalledWith({
      opacity: [0, 1],
      x: [distance, 0],
      transition: { duration: 1.3, delay: 0.4, ease: [0.22, 1, 0.36, 1] },
    });
    act(() => window.dispatchEvent(new Event("resize")));
    intersect(container.firstElementChild!);
    expect(controls.start).toHaveBeenCalledTimes(1);
    change(REDUCED_MOTION_QUERY, true);
    expect(controls.set).toHaveBeenLastCalledWith({ opacity: 1, x: 0, y: 0 });
  });

  it("updates the offscreen start after resizing without transforming the observed box", () => {
    vi.stubGlobal("innerWidth", 390);
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue({
      top: 2000,
      left: 80,
    } as DOMRect);
    const { container } = render(
      <ProgressiveReveal effect="slide-from-right">Portrait</ProgressiveReveal>,
    );
    expect(observe).toHaveBeenCalledWith(container.firstElementChild);
    expect(container.firstElementChild).not.toHaveAttribute("style");
    vi.stubGlobal("innerWidth", 932);
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue({
      top: 2000,
      left: 620,
    } as DOMRect);
    act(() => window.dispatchEvent(new Event("resize")));
    expect(controls.set).toHaveBeenLastCalledWith({ opacity: 1, x: 336, y: 0 });
    intersect(container.firstElementChild!);
    expect(controls.start).toHaveBeenCalledWith(expect.objectContaining({ x: [336, 0] }));
  });

  it("draws a decorative line and resets it immediately for reduced motion", () => {
    const { container } = render(<ProgressiveReveal effect="line">Accent</ProgressiveReveal>);
    intersect(container.firstElementChild!);
    expect(controls.start).toHaveBeenCalledWith({
      opacity: [0, 1],
      scaleX: [0, 1],
      transition: { duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] },
    });
    change(REDUCED_MOTION_QUERY, true);
    expect(controls.set).toHaveBeenLastCalledWith({ opacity: 1, x: 0, y: 0, scaleX: 1 });
  });

  it.each([false, true])("uses a restrained title scale on desktop=%s", (desktop) => {
    matches[EXPRESSIVE_MOTION_QUERY] = desktop;
    const { container } = render(<ProgressiveReveal effect="focus">Heading</ProgressiveReveal>);
    intersect(container.firstElementChild!);
    expect(controls.start).toHaveBeenCalledWith({
      opacity: [0, 1],
      scale: [desktop ? 0.97 : 0.99, 1],
      transition: { duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] },
    });
    change(REDUCED_MOTION_QUERY, true);
    expect(controls.set).toHaveBeenLastCalledWith({ opacity: 1, x: 0, y: 0, scale: 1 });
  });

  it.each([false, true])("coordinates nearby groups only on desktop (%s)", (desktop) => {
    matches[EXPRESSIVE_MOTION_QUERY] = desktop;
    const { container } = render(
      <ProgressiveReveal desktopDelay={0.12}>Biography</ProgressiveReveal>,
    );
    intersect(container.firstElementChild!);
    expect(controls.start).toHaveBeenCalledWith(
      expect.objectContaining({
        transition: expect.objectContaining({ delay: desktop ? 0.12 : 0.3 }),
      }),
    );
  });

  it("keeps already visible content static", () => {
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue({ top: 10 } as DOMRect);
    render(<ProgressiveReveal>Metrics</ProgressiveReveal>);
    expect(observe).not.toHaveBeenCalled();
    expect(controls.set).toHaveBeenLastCalledWith({ opacity: 1, x: 0, y: 0 });
  });

  it("prioritizes reduced motion and never replays after it changes", () => {
    matches[EXPRESSIVE_MOTION_QUERY] = true;
    matches[REDUCED_MOTION_QUERY] = true;
    render(<ProgressiveReveal>Metrics</ProgressiveReveal>);
    expect(observe).not.toHaveBeenCalled();
    change(REDUCED_MOTION_QUERY, false);
    expect(observe).not.toHaveBeenCalled();
    expect(controls.set).toHaveBeenLastCalledWith({ opacity: 1, x: 0, y: 0 });
  });

  it("cancels an active entrance when reduced motion is enabled", () => {
    const { container, unmount } = render(<ProgressiveReveal>Metrics</ProgressiveReveal>);
    intersect(container.firstElementChild!);
    change(REDUCED_MOTION_QUERY, true);
    expect(controls.stop).toHaveBeenCalled();
    expect(controls.set).toHaveBeenLastCalledWith({ opacity: 1, x: 0, y: 0 });
    unmount();
    expect(listeners.size).toBe(0);
  });

  it.each(["matchMedia", "IntersectionObserver"])("falls back without %s", (api) => {
    vi.stubGlobal(api, undefined);
    render(<ProgressiveReveal>Metrics</ProgressiveReveal>);
    expect(observe).not.toHaveBeenCalled();
    expect(controls.set).toHaveBeenLastCalledWith({ opacity: 1, x: 0, y: 0 });
  });
});
