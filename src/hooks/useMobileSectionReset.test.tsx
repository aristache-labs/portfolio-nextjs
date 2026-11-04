import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { installMatchMedia } from "@/test/matchMedia";
import { beginSectionNavigation } from "@/lib/section-navigation";
import { MOBILE_SECTION_RESET_QUERY, useMobileSectionReset } from "./useMobileSectionReset";

let deliver: IntersectionObserverCallback;
let bounds = { top: 100, bottom: 600 };
let headingTop = 120;
let markerTop = 100;
const frames = new Map<number, FrameRequestCallback>();
let nextFrame = 0;
const observe = vi.fn();
const disconnect = vi.fn();
const scrollBy = vi.fn();

function Example({ marker = false }: { marker?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [paused, setPaused] = useState(false);
  useMobileSectionReset(ref, expanded, () => setExpanded(false), paused);
  return (
    <>
      <header />
      <section id="source" data-expanded={expanded}>
        {marker && <span data-section-reset-start data-testid="marker" />}
        <h2>Source heading</h2>
        <div ref={ref}>
          <button onClick={() => setExpanded(true)}>Expand</button>
          <button onClick={() => setPaused((value) => !value)}>Toggle dialog</button>
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
  headingTop = 120;
  markerTop = 100;
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
    if (this.hasAttribute("data-section-reset-start")) {
      return { top: markerTop, bottom: markerTop + 1 } as DOMRect;
    }
    return { top: headingTop, bottom: headingTop + 40 } as DOMRect;
  });
});

afterEach(() => {
  cleanup();
  flushFrames();
  flushFrames();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("preserves state above the reader and resets only when its heading returns below the header", () => {
  render(<Example />);
  expect(observe).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Expand" }));
  expect(observe).toHaveBeenCalledWith(document.getElementById("source"));
  expect(observe).toHaveBeenCalledWith(screen.getByRole("heading"));
  notify();
  expect(screen.getByText("Expanded")).toBeInTheDocument();
  bounds = { top: -500, bottom: 90 };
  headingTop = -480;
  notify();
  expect(screen.getByText("Expanded")).toBeInTheDocument();
  bounds = { top: -700, bottom: -10 };
  headingTop = -680;
  notify();
  expect(screen.getByText("Expanded")).toBeInTheDocument();
  bounds = { top: 0, bottom: 600 };
  headingTop = 20;
  notify();
  expect(screen.getByText("Expanded")).toBeInTheDocument();
  bounds = { top: 90, bottom: 690 };
  headingTop = 110;
  notify();
  expect(screen.getByText("Collapsed")).toBeInTheDocument();
  expect(scrollBy).not.toHaveBeenCalled();
  expect(document.documentElement.style.overflowAnchor).toBe("");
});

it("resets when leaving upwards without moving content above the section", () => {
  render(<Example />);
  fireEvent.click(screen.getByRole("button", { name: "Expand" }));
  bounds = { top: innerHeight + 10, bottom: innerHeight + 500 };
  notify();
  expect(screen.getByText("Collapsed")).toBeInTheDocument();
  expect(scrollBy).not.toHaveBeenCalled();
});

it("preserves state after menu departure and waits for arrival back at its beginning", () => {
  render(<Example />);
  fireEvent.click(screen.getByRole("button", { name: "Expand" }));
  const finish = beginSectionNavigation(document.getElementById("next")!);
  bounds = { top: -700, bottom: -10 };
  headingTop = -680;
  notify();
  expect(screen.getByText("Expanded")).toBeInTheDocument();
  act(() => finish());
  flushFrames();
  expect(screen.getByText("Expanded")).toBeInTheDocument();
  const returnToSource = beginSectionNavigation(document.getElementById("source")!);
  bounds = { top: 90, bottom: 690 };
  headingTop = 110;
  notify();
  expect(screen.getByText("Expanded")).toBeInTheDocument();
  act(() => returnToSource());
  flushFrames();
  expect(screen.getByText("Collapsed")).toBeInTheDocument();
  expect(scrollBy).not.toHaveBeenCalled();
});

it("remembers menu departure with a visible tail but keeps the document height until returning", () => {
  render(<Example />);
  fireEvent.click(screen.getByRole("button", { name: "Expand" }));
  const finish = beginSectionNavigation(document.getElementById("next")!);
  bounds = { top: -500, bottom: 100 };
  headingTop = -480;
  act(() => finish(true));
  flushFrames();
  expect(screen.getByText("Expanded")).toBeInTheDocument();
  bounds = { top: 90, bottom: 690 };
  headingTop = 110;
  notify();
  expect(screen.getByText("Collapsed")).toBeInTheDocument();
  expect(scrollBy).not.toHaveBeenCalled();
});

it("ignores a sticky heading and waits for the in-flow start marker", () => {
  render(<Example marker />);
  fireEvent.click(screen.getByRole("button", { name: "Expand" }));
  expect(observe).toHaveBeenCalledWith(screen.getByTestId("marker"));
  bounds = { top: -900, bottom: -10 };
  markerTop = -900;
  notify();
  // Back inside the lower timeline: the sticky heading is visible, the start is not.
  bounds = { top: -800, bottom: 300 };
  markerTop = -800;
  headingTop = 110;
  notify();
  expect(screen.getByText("Expanded")).toBeInTheDocument();
  bounds = { top: 70, bottom: 1170 };
  markerTop = 80;
  notify();
  expect(screen.getByText("Collapsed")).toBeInTheDocument();
  expect(scrollBy).not.toHaveBeenCalled();
});

it("keeps a recorded departure while paused and resets after resuming", () => {
  render(<Example />);
  fireEvent.click(screen.getByRole("button", { name: "Expand" }));
  bounds = { top: -700, bottom: -10 };
  headingTop = -680;
  notify();
  bounds = { top: -500, bottom: 300 };
  headingTop = -480;
  notify();
  fireEvent.click(screen.getByRole("button", { name: "Toggle dialog" }));
  bounds = { top: 90, bottom: 690 };
  headingTop = 110;
  notify();
  expect(screen.getByText("Expanded")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Toggle dialog" }));
  notify();
  expect(screen.getByText("Collapsed")).toBeInTheDocument();
});

it("preserves desktop state without installing an observer", () => {
  installMatchMedia();
  render(<Example />);
  fireEvent.click(screen.getByRole("button", { name: "Expand" }));
  expect(observe).not.toHaveBeenCalled();
  expect(screen.getByText("Expanded")).toBeInTheDocument();
});

it("keeps visible state when the visitor interrupts a menu transition", () => {
  render(<Example />);
  fireEvent.click(screen.getByRole("button", { name: "Expand" }));
  const finish = beginSectionNavigation(document.getElementById("next")!);
  act(() => finish(false));
  flushFrames();
  notify();
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
