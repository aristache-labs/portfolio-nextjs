import { afterEach, describe, expect, it, vi } from "vitest";
import { beginSectionNavigation } from "./section-navigation";

const scrollToPosition = vi.fn<(...args: unknown[]) => () => void>(() => () => {});
const sectionScrollPosition = vi.fn((element: HTMLElement) => Number(element.dataset.position));

vi.mock("./scroll-to-section", () => ({
  scrollToPosition: (...args: unknown[]) => scrollToPosition(...args),
  sectionScrollPosition: (element: HTMLElement) => sectionScrollPosition(element),
}));

const {
  SNAP_DURATION_MS,
  SNAP_MAX_DISTANCE,
  SNAP_THRESHOLD_RATIO,
  SNAP_TOUCH_DURATION_MS,
  SNAP_TOUCH_MAX_DISTANCE,
  SNAP_TOUCH_THRESHOLD_RATIO,
  pickSnapTarget,
  settleOnNearestSection,
  snapDistance,
} = await import("./section-snap");

afterEach(() => {
  // The mocked glide never ends by itself: end every jump a test started, or the next test would
  // see a section jump still in progress.
  for (const call of scrollToPosition.mock.calls)
    (call[2] as ((arrived: boolean) => void) | undefined)?.(false);
  document.body.innerHTML = "";
  scrollToPosition.mockClear();
  vi.restoreAllMocks();
});

const sections = [
  { id: "about", position: 1000 },
  { id: "skills", position: 2400 },
];

describe("snapDistance", () => {
  it("is a share of the viewport, capped on tall screens", () => {
    expect(snapDistance(400)).toBeCloseTo(400 * SNAP_THRESHOLD_RATIO);
    expect(snapDistance(2000)).toBe(SNAP_MAX_DISTANCE);
  });
});

describe("touch distances", () => {
  it("are shorter than the desktop ones and capped", () => {
    expect(snapDistance(600, true)).toBeCloseTo(600 * SNAP_TOUCH_THRESHOLD_RATIO);
    expect(snapDistance(2000, true)).toBe(SNAP_TOUCH_MAX_DISTANCE);
    expect(snapDistance(800, true)).toBeLessThan(snapDistance(800));
  });

  it("pull from a shorter reach on touch", () => {
    expect(pickSnapTarget(sections, 1100, 900, false)?.id).toBe("about");
    expect(pickSnapTarget(sections, 1100, 900, true)).toBeNull();
    expect(pickSnapTarget(sections, 1060, 900, true)?.id).toBe("about");
  });
});

describe("pickSnapTarget", () => {
  it("picks the nearest section start within reach, before or after it", () => {
    expect(pickSnapTarget(sections, 960, 900)?.id).toBe("about");
    expect(pickSnapTarget(sections, 1060, 900)?.id).toBe("about");
    expect(pickSnapTarget(sections, 2350, 900)?.id).toBe("skills");
  });

  it("leaves the middle of a section and of a scene alone", () => {
    expect(pickSnapTarget(sections, 1700, 900)).toBeNull();
    expect(pickSnapTarget(sections, 1200, 900)).toBeNull();
  });

  it("does nothing when the page is already in place", () => {
    expect(pickSnapTarget(sections, 1000, 900)).toBeNull();
    expect(pickSnapTarget(sections, 1001.5, 900)).toBeNull();
  });

  it("does nothing without sections", () => {
    expect(pickSnapTarget([], 500, 900)).toBeNull();
  });
});

describe("settleOnNearestSection", () => {
  const mount = () => {
    document.body.innerHTML =
      '<section id="about" data-position="1000"></section><section id="skills" data-position="2400"></section>';
    vi.spyOn(window, "scrollY", "get").mockReturnValue(1040);
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(900);
    // jsdom has no layout: give every section a real height, as a rendered one has.
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      height: 600,
    } as DOMRect);
  };

  it("glides to the near section with a short duration", () => {
    mount();
    expect(settleOnNearestSection()).not.toBeNull();
    expect(scrollToPosition).toHaveBeenCalledTimes(1);
    const [destination, reduced, , options] = scrollToPosition.mock.calls[0] as [
      () => number,
      boolean,
      unknown,
      { duration: number },
    ];
    expect(destination()).toBe(1000);
    expect(reduced).toBe(false);
    expect(options).toEqual({ duration: SNAP_DURATION_MS });
  });

  it("uses the quicker glide on touch screens", () => {
    mount();
    vi.spyOn(window, "scrollY", "get").mockReturnValue(1060);
    expect(settleOnNearestSection(true)).not.toBeNull();
    const [, , , options] = scrollToPosition.mock.calls[0] as [
      unknown,
      unknown,
      unknown,
      { duration: number },
    ];
    expect(options).toEqual({ duration: SNAP_TOUCH_DURATION_MS });
  });

  it("does not pull from the longer desktop reach on touch screens", () => {
    mount();
    vi.spyOn(window, "scrollY", "get").mockReturnValue(1095);
    expect(settleOnNearestSection(true)).toBeNull();
    expect(scrollToPosition).not.toHaveBeenCalled();
  });

  it("ignores a section that has not rendered yet", () => {
    mount();
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      height: 0,
    } as DOMRect);
    expect(settleOnNearestSection()).toBeNull();
    expect(scrollToPosition).not.toHaveBeenCalled();
  });

  it("does nothing while a section jump is running", () => {
    mount();
    const finish = beginSectionNavigation(document.getElementById("skills")!);
    expect(settleOnNearestSection()).toBeNull();
    expect(scrollToPosition).not.toHaveBeenCalled();
    finish(false);
  });

  it("does nothing when no section is near", () => {
    mount();
    vi.spyOn(window, "scrollY", "get").mockReturnValue(1700);
    expect(settleOnNearestSection()).toBeNull();
    expect(scrollToPosition).not.toHaveBeenCalled();
  });
});
