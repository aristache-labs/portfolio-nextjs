import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const lenis = vi.hoisted(() => ({
  scroll: 0,
  scrollTo: vi.fn(),
}));
vi.mock("./smooth-scroll", () => ({ getSmoothScroll: () => lenis }));

import { scrollToSection } from "./scroll-to-section";
import { subscribeSectionNavigationComplete } from "./section-navigation";

type ScrollOptions = { onComplete?: () => void; immediate?: boolean };

let target: HTMLElement;
let top: number;

beforeEach(() => {
  document.body.innerHTML = '<section id="contact"></section>';
  target = document.getElementById("contact")!;
  top = 3000;
  vi.spyOn(target, "getBoundingClientRect").mockImplementation(() => ({ top }) as DOMRect);
  vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(9000);
  vi.stubGlobal("scrollY", 0);
  vi.stubGlobal("innerHeight", 800);
  lenis.scroll = 0;
  lenis.scrollTo.mockReset();
});

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

describe("scrollToSection through Lenis", () => {
  it("finishes the navigation once the jump lands", () => {
    const onFinish = vi.fn();
    const unsubscribe = subscribeSectionNavigationComplete(onFinish);
    scrollToSection("contact", false);
    const options = lenis.scrollTo.mock.calls[0][1] as ScrollOptions;
    expect(onFinish).not.toHaveBeenCalled();
    options.onComplete?.();
    expect(onFinish).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("lands on the target's current position when a section moved it on the way", () => {
    scrollToSection("contact", false);
    const [destination, options] = lenis.scrollTo.mock.calls[0] as [number, ScrollOptions];
    expect(destination).toBe(3000);
    // Content above finished rendering during the jump and pushed the section down.
    top = 3180;
    lenis.scroll = 3000;
    options.onComplete?.();
    expect(lenis.scrollTo).toHaveBeenCalledTimes(2);
    expect(lenis.scrollTo.mock.calls[1][0]).toBe(3180);
    expect((lenis.scrollTo.mock.calls[1][1] as ScrollOptions).immediate).toBe(true);
  });

  it("does not nudge the page when it already landed on target", () => {
    scrollToSection("contact", false);
    const options = lenis.scrollTo.mock.calls[0][1] as ScrollOptions;
    lenis.scroll = 3000;
    options.onComplete?.();
    expect(lenis.scrollTo).toHaveBeenCalledTimes(1);
  });
});
