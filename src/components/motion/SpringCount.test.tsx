import { act, cleanup, render } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { EXPRESSIVE_MOTION_QUERY, REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { countFormat, SpringCount } from "./SpringCount";

const spring = vi.hoisted(() => ({ animate: vi.fn(), stop: vi.fn() }));
vi.mock("framer-motion", () => ({ animate: spring.animate }));
let notify: IntersectionObserverCallback;
let matches: Record<string, boolean>;
let listeners: Set<() => void>;
const disconnect = vi.fn();
const observe = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  spring.animate.mockReturnValue({ stop: spring.stop });
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
      constructor(callback: IntersectionObserverCallback) {
        notify = callback;
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

function change(query: string, value: boolean) {
  act(() => {
    matches[query] = value;
    listeners.forEach((listener) => listener());
  });
}

function enter(node: Element, isIntersecting = true, bottom = 400) {
  act(() =>
    notify(
      [
        {
          target: node,
          isIntersecting,
          boundingClientRect: { bottom },
        } as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    ),
  );
}

it.each([
  ["1,600+", 1600, 800, "800+"],
  ["60%", 60, 30, "30%"],
  ["8+", 8, 4, "4+"],
  ["5", 5, 2, "2"],
  ["$1,234.50+", 1234.5, 1000, "$1,000.00+"],
] as const)("preserves the format of %s", (value, target, progress, formatted) => {
  const number = countFormat(value)!;
  expect(number.target).toBe(target);
  expect(number.format(progress)).toBe(formatted);
  expect(number.format(target * 2)).toBe(value);
});

it.each(["Many", "", "Infinity"])("keeps nonnumeric values static: %s", (value) => {
  expect(countFormat(value)).toBeNull();
  const { container } = render(<SpringCount value={value} />);
  expect(container.querySelector("[aria-hidden]")?.textContent).toBe(value);
  expect(observe).not.toHaveBeenCalled();
});

it.each([
  [1440, 900, true],
  [390, 844, false],
  [844, 390, false],
])("counts once from zero using spring physics at %sx%s", (width, height, desktop) => {
  vi.stubGlobal("innerWidth", width);
  vi.stubGlobal("innerHeight", height);
  matches[EXPRESSIVE_MOTION_QUERY] = desktop;
  const { container, unmount } = render(<SpringCount value="1,600+" />);
  const node = container.firstElementChild!;
  const output = node.querySelector("[aria-hidden]")!;
  expect(output.textContent).toBe("0+");
  expect(node.firstElementChild).toHaveTextContent("1,600+");
  expect(node.firstElementChild).toHaveClass("opacity-0");
  expect(node).toHaveClass("inline-grid", "tabular-nums");
  expect(node.querySelector("[aria-live]")).toBeNull();
  enter(node, false);
  expect(spring.animate).not.toHaveBeenCalled();
  enter(node);
  expect(spring.animate).toHaveBeenCalledWith(
    0,
    1600,
    expect.objectContaining({
      type: "spring",
      stiffness: 90,
      damping: 20,
      mass: 1,
      delay: 0.3,
    }),
  );
  const options = spring.animate.mock.calls[0][2];
  act(() => options.onUpdate(800));
  expect(output.textContent).toBe("800+");
  act(() => options.onComplete());
  expect(output.textContent).toBe("1,600+");
  enter(node);
  act(() => window.dispatchEvent(new Event("resize")));
  change(EXPRESSIVE_MOTION_QUERY, !desktop);
  enter(node);
  expect(spring.animate).toHaveBeenCalledTimes(1);
  unmount();
  expect(disconnect).toHaveBeenCalled();
  expect(spring.stop).toHaveBeenCalled();
  expect(listeners.size).toBe(0);
});

it("stops active counting for reduced motion and ignores late frames", () => {
  const { container } = render(<SpringCount value="60%" />);
  enter(container.firstElementChild!);
  const options = spring.animate.mock.calls[0][2];
  change(REDUCED_MOTION_QUERY, true);
  expect(spring.stop).toHaveBeenCalled();
  options.onUpdate(10);
  expect(container.querySelector("[aria-hidden]")).toHaveTextContent("60%");
  change(REDUCED_MOTION_QUERY, false);
  expect(spring.animate).toHaveBeenCalledTimes(1);
});

it("restores skipped values after a fast scroll", () => {
  const { container } = render(<SpringCount value="8+" />);
  enter(container.firstElementChild!, false, -10);
  expect(container.querySelector("[aria-hidden]")).toHaveTextContent("8+");
  expect(spring.animate).not.toHaveBeenCalled();
});

it.each([false, true])(
  "hydrates visible final server text without mismatches (reduced=%s)",
  async (reduced) => {
    matches[REDUCED_MOTION_QUERY] = reduced;
    if (!reduced)
      vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue({
        top: 10,
      } as DOMRect);
    const content = <SpringCount value="1,600+" />;
    const container = document.createElement("div");
    container.innerHTML = renderToString(content);
    expect(container.querySelector("[aria-hidden]")).toHaveTextContent("1,600+");
    document.body.append(container);
    const onRecoverableError = vi.fn();
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, content, { onRecoverableError });
      });
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(container.querySelector("[aria-hidden]")).toHaveTextContent("1,600+");
      expect(spring.animate).not.toHaveBeenCalled();
      expect(observe).not.toHaveBeenCalled();
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  },
);
