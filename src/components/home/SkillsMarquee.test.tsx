import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { installMatchMedia } from "@/test/matchMedia";
import { revealInset, MOBILE_REVEAL_DEPTH } from "@/lib/reveal-depth";
import { beginSectionNavigation } from "@/lib/section-navigation";
import { SkillsMarquee } from "./SkillsMarquee";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function setup({ inSection = false } = {}) {
  installMatchMedia();
  const observer = {
    notify: undefined as unknown as IntersectionObserverCallback,
    options: undefined as IntersectionObserverInit | undefined,
    disconnect: vi.fn(),
  };
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        observer.notify = callback;
        observer.options = options;
      }
      observe() {}
      disconnect = observer.disconnect;
    },
  );
  const marquee = (
    <SkillsMarquee skills={[{ name: "React", iconPath: "/skills/react.svg" }]} loadIcons />
  );
  const view = render(inSection ? <section>{marquee}</section> : marquee);
  const section = view.container.firstElementChild as HTMLElement;
  const strip = (inSection ? section.firstElementChild : section) as HTMLElement;
  const emit = (isIntersecting: boolean) =>
    act(() =>
      observer.notify(
        [{ isIntersecting } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    );
  return { ...view, observer, strip, section, emit };
}

describe("SkillsMarquee entrance", () => {
  it("waits until it is properly on screen, then plays once and stays", () => {
    const { observer, strip, unmount, emit } = setup();
    expect(strip.dataset.entrance).toBe("armed");
    // Not merely touching the bottom edge: the observed area stops short of it.
    expect(observer.options?.rootMargin).toBe(`0px 0px -${revealInset(MOBILE_REVEAL_DEPTH)}px 0px`);
    emit(false);
    expect(strip.dataset.entrance).toBe("armed");
    emit(true);
    expect(strip.dataset.entrance).toBe("visible");
    // It plays once: observing stops, so scrolling past again never replays the entrance.
    expect(observer.disconnect).toHaveBeenCalledOnce();
    unmount();
    expect(strip.dataset.entrance).toBe("visible");
  });

  it("plays when a jump lands with it on screen but inside the wait band", () => {
    vi.stubGlobal("innerHeight", 600);
    const { strip, section } = setup({ inSection: true });
    vi.spyOn(strip, "getBoundingClientRect").mockReturnValue({
      top: 530,
      bottom: 570,
      height: 40,
    } as DOMRect);
    // 530px is below the observed area (it stops at 600 minus the inset), so the observer is quiet.
    expect(strip.dataset.entrance).toBe("armed");
    const finish = beginSectionNavigation(section);
    expect(strip.dataset.entrance).toBe("armed");
    act(() => finish(true));
    expect(strip.dataset.entrance).toBe("visible");
  });

  it("stays hidden when the page stops with it below the screen", () => {
    vi.stubGlobal("innerHeight", 600);
    const { strip } = setup();
    vi.spyOn(strip, "getBoundingClientRect").mockReturnValue({
      top: 640,
      bottom: 680,
      height: 40,
    } as DOMRect);
    act(() => {
      window.dispatchEvent(new Event("scrollend"));
    });
    expect(strip.dataset.entrance).toBe("armed");
  });

  it("does not spend its entrance on a section jump that only passes through", () => {
    const { strip, emit } = setup();
    const destination = document.createElement("section");
    document.body.append(destination);
    const finish = beginSectionNavigation(destination);
    emit(true);
    expect(strip.dataset.entrance).toBe("armed");
    act(() => finish(true));
    destination.remove();
  });
});
