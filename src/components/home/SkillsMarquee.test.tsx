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

function setup() {
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
  const view = render(
    <SkillsMarquee skills={[{ name: "React", iconPath: "/skills/react.svg" }]} loadIcons />,
  );
  const strip = view.container.firstElementChild as HTMLElement;
  const emit = (isIntersecting: boolean) =>
    act(() =>
      observer.notify(
        [{ isIntersecting } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    );
  return { ...view, observer, strip, emit };
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
