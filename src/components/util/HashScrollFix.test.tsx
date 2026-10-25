import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HashScrollFix } from "./HashScrollFix";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("HashScrollFix", () => {
  let scroll = 0;
  let targetTop = 1000;
  let visible = true;
  const originalScrollY = Object.getOwnPropertyDescriptor(window, "scrollY")!;

  function installSection() {
    const wrapper = document.createElement("div");
    wrapper.innerHTML =
      '<header><nav aria-label="Primary"></nav></header><section id="about"><div data-scroll-anchor></div></section>';
    document.body.append(wrapper);
    const section = wrapper.querySelector("section")!;
    vi.spyOn(section, "getClientRects").mockImplementation(
      () => ({ length: visible ? 1 : 0 }) as DOMRectList,
    );
    vi.spyOn(wrapper.querySelector("nav")!, "getBoundingClientRect").mockReturnValue({
      height: 72,
    } as DOMRect);
    vi.spyOn(section.firstElementChild!, "getBoundingClientRect").mockImplementation(
      () => ({ top: targetTop - scroll }) as DOMRect,
    );
  }

  beforeEach(() => {
    vi.useFakeTimers();
    scroll = 0;
    targetTop = 1000;
    visible = true;
    window.history.replaceState(null, "", "/#about");
    Object.defineProperty(window, "scrollY", { configurable: true, get: () => scroll });
    vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(4000);
    vi.spyOn(window, "scrollTo").mockImplementation((options: number | ScrollToOptions) => {
      if (typeof options === "object") scroll = options.top ?? scroll;
    });
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    window.history.replaceState(null, "", "/");
    vi.restoreAllMocks();
    Object.defineProperty(window, "scrollY", originalScrollY);
    vi.useRealTimers();
  });

  it.each([0, 1500])("corrects a restored scroll of %ipx without a layout change", (restored) => {
    installSection();
    render(<HashScrollFix />);
    expect(scroll).toBe(890);
    scroll = restored;
    act(() => vi.advanceTimersByTime(100));
    expect(scroll).toBe(890);
  });

  it("waits for a streamed section that appears after the old two-second deadline", () => {
    render(<HashScrollFix />);
    act(() => vi.advanceTimersByTime(2500));
    expect(window.scrollTo).not.toHaveBeenCalled();
    installSection();
    act(() => vi.advanceTimersByTime(100));
    expect(scroll).toBe(890);
  });

  it("does not align a section inside a hidden streaming boundary", () => {
    visible = false;
    installSection();
    render(<HashScrollFix />);
    act(() => vi.advanceTimersByTime(500));
    expect(window.scrollTo).not.toHaveBeenCalled();
    visible = true;
    act(() => vi.advanceTimersByTime(100));
    expect(scroll).toBe(890);
  });

  it("realigns after late page readiness and subsequent native scroll restoration", () => {
    installSection();
    render(<HashScrollFix />);
    act(() => vi.advanceTimersByTime(2500));
    fireEvent(window, new Event("pageshow"));
    scroll = 0;
    act(() => vi.advanceTimersByTime(100));
    expect(scroll).toBe(890);
  });

  it("tracks a layout shift while the initial anchor settles", () => {
    installSection();
    render(<HashScrollFix />);
    targetTop = 1200;
    act(() => vi.advanceTimersByTime(100));
    expect(scroll).toBe(1090);
  });

  it.each(["touchmove", "wheel", "pointerdown", "keydown"])(
    "yields to %s and stays cancelled when the page finishes loading",
    (event) => {
      installSection();
      render(<HashScrollFix />);
      if (event === "keydown") fireEvent.keyDown(window, { key: "PageDown" });
      else fireEvent(window, new Event(event));
      scroll = 0;
      fireEvent.load(window);
      fireEvent(window, new Event("pageshow"));
      act(() => vi.advanceTimersByTime(5000));
      expect(scroll).toBe(0);
    },
  );

  it("stops when the URL moves to another anchor", () => {
    installSection();
    render(<HashScrollFix />);
    window.history.replaceState(null, "", "/#hero");
    scroll = 0;
    act(() => vi.advanceTimersByTime(100));
    fireEvent.load(window);
    expect(scroll).toBe(0);
  });
});
