import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { installMatchMedia } from "@/test/matchMedia";
import { beginSectionNavigation } from "@/lib/section-navigation";
import { MOBILE_SECTION_RESET_QUERY, useMobileSectionReset } from "./useMobileSectionReset";

let deliver: IntersectionObserverCallback;
let bounds = { top: 100, bottom: 600 };
const frames = new Map<number, FrameRequestCallback>();
let nextFrame = 0;
const observe = vi.fn();
const disconnect = vi.fn();
const scrollBy = vi.fn();

function Example() {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  useMobileSectionReset(ref, expanded, () => setExpanded(false));
  return (
    <>
      <header />
      <section id="source" data-expanded={expanded}>
        <div ref={ref}>
          <button onClick={() => setExpanded(true)}>Expand</button>
          <span>{expanded ? "Expanded" : "Collapsed"}</span>
        </div>
      </section>
      <section id="next">Next section</section>
    </>
  );
}

function flushFrames() {
  act(() => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((frame) => frame(0));
  });
}

function notify() {
  act(() => deliver([], {} as IntersectionObserver));
  flushFrames();
}

beforeEach(() => {
  bounds = { top: 100, bottom: 600 };
  frames.clear();
  vi.clearAllMocks();
  installMatchMedia({ [MOBILE_SECTION_RESET_QUERY]: true });
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        deliver = callback;
      }
      observe = observe;
      disconnect = disconnect;
    },
  );
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
    frames.delete(id);
  });
  vi.spyOn(window, "scrollBy").mockImplementation(scrollBy);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
    this: HTMLElement,
  ) {
    if (this.tagName === "HEADER") return { top: 0, bottom: 72 } as DOMRect;
    if (this.id === "source") return bounds as DOMRect;
    const expanded = document.getElementById("source")?.dataset.expanded === "true";
    return { top: expanded ? 120 : -80 } as DOMRect;
  });
});

afterEach(() => {
  cleanup();
  flushFrames();
  flushFrames();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("observes the whole section and keeps state until it has completely left", () => {
  render(<Example />);
  expect(observe).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Expand" }));
  expect(observe).toHaveBeenCalledWith(document.getElementById("source"));
  notify();
  expect(screen.getByText("Expanded")).toBeInTheDocument();
  bounds = { top: -500, bottom: 90 };
  notify();
  expect(screen.getByText("Expanded")).toBeInTheDocument();
  bounds = { top: -700, bottom: -10 };
  notify();
  expect(screen.getByText("Collapsed")).toBeInTheDocument();
  expect(scrollBy).toHaveBeenCalledWith({ top: -200, behavior: "instant" });
});

it("resets when leaving upwards without moving content above the section", () => {
  render(<Example />);
  fireEvent.click(screen.getByRole("button", { name: "Expand" }));
  bounds = { top: innerHeight + 10, bottom: innerHeight + 500 };
  notify();
  expect(screen.getByText("Collapsed")).toBeInTheDocument();
  expect(scrollBy).not.toHaveBeenCalled();
});

it("waits for menu scrolling to finish before collapsing the source", () => {
  render(<Example />);
  fireEvent.click(screen.getByRole("button", { name: "Expand" }));
  const finish = beginSectionNavigation(document.getElementById("next")!);
  bounds = { top: -700, bottom: -10 };
  notify();
  expect(screen.getByText("Expanded")).toBeInTheDocument();
  act(() => finish());
  flushFrames();
  expect(screen.getByText("Collapsed")).toBeInTheDocument();
});

it("preserves desktop state without installing an observer", () => {
  installMatchMedia();
  render(<Example />);
  fireEvent.click(screen.getByRole("button", { name: "Expand" }));
  expect(observe).not.toHaveBeenCalled();
  expect(screen.getByText("Expanded")).toBeInTheDocument();
});

it("resets after arriving elsewhere even when a small section tail is still visible", () => {
  render(<Example />);
  fireEvent.click(screen.getByRole("button", { name: "Expand" }));
  const finish = beginSectionNavigation(document.getElementById("next")!);
  bounds = { top: -500, bottom: 100 };
  act(() => finish(true));
  flushFrames();
  expect(screen.getByText("Collapsed")).toBeInTheDocument();
  expect(scrollBy).toHaveBeenCalledWith({ top: -200, behavior: "instant" });
  flushFrames();
  flushFrames();
  expect(document.documentElement.style.overflowAnchor).toBe("");
});

it("keeps visible state when the visitor interrupts a menu transition", () => {
  render(<Example />);
  fireEvent.click(screen.getByRole("button", { name: "Expand" }));
  const finish = beginSectionNavigation(document.getElementById("next")!);
  act(() => finish(false));
  flushFrames();
  expect(screen.getByText("Expanded")).toBeInTheDocument();
});

it("cancels a pending reset on unmount", () => {
  const { unmount } = render(<Example />);
  fireEvent.click(screen.getByRole("button", { name: "Expand" }));
  act(() => deliver([], {} as IntersectionObserver));
  unmount();
  flushFrames();
  expect(scrollBy).not.toHaveBeenCalled();
  expect(disconnect).toHaveBeenCalled();
});
