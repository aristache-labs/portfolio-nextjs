import { afterEach, describe, expect, it, vi } from "vitest";
import { sectionScrollPosition } from "./scroll-to-section";

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

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

  it("preserves CSS scroll margins for anchors without a content marker", () => {
    const target = document.createElement("div");
    target.style.scrollMarginTop = "96px";
    vi.spyOn(target, "getBoundingClientRect").mockReturnValue({ top: 500 } as DOMRect);
    expect(sectionScrollPosition(target)).toBe(500 + window.scrollY - 96);
  });
});
