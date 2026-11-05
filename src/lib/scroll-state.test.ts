import { afterEach, describe, expect, it, vi } from "vitest";
import { subscribeScroll } from "./scroll-state";

afterEach(() => vi.restoreAllMocks());

describe("subscribeScroll", () => {
  it("attaches one scroll listener for any number of subscribers and detaches at zero", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const first = subscribeScroll(() => {});
    const second = subscribeScroll(() => {});
    expect(add.mock.calls.filter(([type]) => type === "scroll")).toHaveLength(1);

    first();
    expect(remove.mock.calls.filter(([type]) => type === "scroll")).toHaveLength(0);
    second();
    expect(remove.mock.calls.filter(([type]) => type === "scroll")).toHaveLength(1);
  });

  it("calls every subscriber once per frame however many scroll events arrive", () => {
    let frame: FrameRequestCallback = () => {};
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frame = callback;
      return 1;
    });
    const a = vi.fn();
    const b = vi.fn();
    const stopA = subscribeScroll(a);
    const stopB = subscribeScroll(b);

    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("scroll"));
    frame(0);

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    stopA();
    stopB();
    vi.unstubAllGlobals();
  });
});
