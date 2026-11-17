import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { pickActive, useScrollSpy } from "./useScrollSpy";

describe("useScrollSpy", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  });

  it("ignores sections that are still streaming in and re-reads when they appear", () => {
    let grow = () => {};
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: () => void) {
          grow = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    // A streamed section waits in a hidden container: no box, top 0.
    const layout: Record<string, { top: number; shown: boolean }> = {
      hero: { top: 0, shown: true },
      about: { top: 900, shown: true },
      contact: { top: 0, shown: false },
    };
    for (const id of Object.keys(layout)) {
      const el = document.body.appendChild(document.createElement("section"));
      el.id = id;
      el.getBoundingClientRect = () => ({ top: layout[id].top }) as DOMRect;
      el.getClientRects = () => (layout[id].shown ? [{}] : []) as unknown as DOMRectList;
    }

    const { result } = renderHook(() => useScrollSpy(["hero", "about", "contact"]));
    expect(result.current).toBe("hero");

    layout.contact = { top: 2400, shown: true };
    act(() => grow());
    expect(result.current).toBe("hero");

    // Measured again on growth, so a section that lands above the line becomes active without a scroll.
    layout.about.top = 60;
    act(() => grow());
    expect(result.current).toBe("about");
  });
});

describe("pickActive", () => {
  const ids = ["hero", "about", "skills"];

  it("returns first section when nothing has scrolled past the offset", () => {
    const tops = { hero: 0, about: 800, skills: 1600 };
    expect(pickActive(ids, tops, 120)).toBe("hero");
  });

  it("returns the last section whose top crossed the offset line", () => {
    const tops = { hero: -900, about: 50, skills: 900 };
    expect(pickActive(ids, tops, 120)).toBe("about");
  });

  it("returns the final section when all have scrolled past", () => {
    const tops = { hero: -2000, about: -1200, skills: -300 };
    expect(pickActive(ids, tops, 120)).toBe("skills");
  });

  it("falls back to the first id when ids is empty of measurements", () => {
    expect(pickActive(ids, {}, 120)).toBe("hero");
  });
});
