import { afterEach, describe, expect, it, vi } from "vitest";
import { scrollToSection, sectionScrollPosition } from "./scroll-to-section";
import { subscribeSectionNavigation } from "./section-navigation";

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  window.history.replaceState(null, "", "/");
});

it("replaces an old anchor without bypassing Next's history integration", () => {
  document.body.innerHTML = '<section id="skills"></section>';
  window.history.replaceState({ __NA: true }, "", "/?preview=1#contact");
  vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(4000);
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  const replace = vi.spyOn(window.history, "replaceState");

  scrollToSection("skills", true);

  expect(replace).toHaveBeenCalledWith(
    null,
    "",
    new URL("/?preview=1#skills", window.location.origin),
  );
  expect(window.location.hash).toBe("#skills");
});

it.each(["arrival", "wheel", "touchmove", "cancel"])(
  "releases waiting entrances on %s exactly once",
  (reason) => {
    document.body.innerHTML = '<section id="about"></section><section id="projects"></section>';
    const target = document.getElementById("about")!;
    const phases = vi.fn();
    const unrelated = vi.fn();
    const unsubscribe = subscribeSectionNavigation(() => target, phases);
    const unsubscribeOther = subscribeSectionNavigation(
      () => document.getElementById("projects"),
      unrelated,
    );
    vi.spyOn(target, "getBoundingClientRect").mockReturnValue({ top: 1000 } as DOMRect);
    vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(4000);
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    let tick!: FrameRequestCallback;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      tick = callback;
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    const cancel = scrollToSection("about", false);
    expect(phases.mock.calls).toEqual([[true]]);
    expect(unrelated).not.toHaveBeenCalled();
    if (reason === "arrival") {
      tick(0);
      tick(2000);
    } else if (reason === "cancel") cancel();
    else window.dispatchEvent(new Event(reason));
    cancel();
    expect(phases.mock.calls).toEqual([[true], [false]]);
    unsubscribe();
    unsubscribeOther();
  },
);

describe("sectionScrollPosition", () => {
  it.each([72, 64])("keeps a 38px content gap below a %ipx navigation bar", (height) => {
    document.body.innerHTML =
      '<header><nav aria-label="Primary"></nav></header><section><div data-scroll-anchor></div></section>';
    const target = document.querySelector("section")!;
    target.style.scrollMarginTop = "8px";
    vi.spyOn(document.querySelector("nav")!, "getBoundingClientRect").mockReturnValue({
      height,
    } as DOMRect);
    vi.spyOn(target.firstElementChild!, "getBoundingClientRect").mockReturnValue({
      top: 1000,
    } as DOMRect);
    expect(sectionScrollPosition(target)).toBe(1000 + window.scrollY - height - 38);
  });

  it("lands a pinned scene at the viewport offset it names", () => {
    document.body.innerHTML =
      '<section><div data-scroll-anchor><div data-scroll-landing="-91"></div></div></section>';
    const target = document.querySelector("section")!;
    vi.spyOn(
      document.querySelector<HTMLElement>("[data-scroll-landing]")!,
      "getBoundingClientRect",
    ).mockReturnValue({ top: 1000 } as DOMRect);
    expect(sectionScrollPosition(target)).toBe(1000 + window.scrollY + 91);
  });

  it("preserves CSS scroll margins for anchors without a content marker", () => {
    const target = document.createElement("div");
    target.style.scrollMarginTop = "96px";
    vi.spyOn(target, "getBoundingClientRect").mockReturnValue({ top: 500 } as DOMRect);
    expect(sectionScrollPosition(target)).toBe(500 + window.scrollY - 96);
  });
});
