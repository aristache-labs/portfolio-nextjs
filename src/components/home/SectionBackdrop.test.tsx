import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installMatchMedia } from "@/test/matchMedia";
import { BACKGROUND_VIDEO_QUERY } from "@/hooks/useMediaQuery";
import { SectionBackdrop } from "./SectionBackdrop";

class FakeIO {
  static instances: FakeIO[] = [];
  constructor(
    readonly callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit,
  ) {
    FakeIO.instances.push(this);
  }
  static emit(target: Element, margin: string, visible: boolean) {
    for (const instance of FakeIO.instances) {
      if (instance.options?.rootMargin !== margin) continue;
      instance.callback(
        [
          {
            target,
            isIntersecting: visible,
            intersectionRatio: visible ? 1 : 0,
          } as IntersectionObserverEntry,
        ],
        instance as unknown as IntersectionObserver,
      );
    }
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

describe("SectionBackdrop", () => {
  let hero: HTMLElement | undefined;

  function installHero(complete: boolean) {
    hero = document.createElement("section");
    hero.id = "hero";
    const image = document.createElement("img");
    image.src = "/media/hero.webp";
    image.setAttribute("fetchpriority", "high");
    Object.defineProperty(image, "complete", { configurable: true, value: complete });
    hero.append(image);
    document.body.append(hero);
    return image;
  }

  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", FakeIO);
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    hero?.remove();
    hero = undefined;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("never mounts a video on mobile, only the lazy poster", () => {
    installMatchMedia({ [BACKGROUND_VIDEO_QUERY]: false });
    const { container } = render(<SectionBackdrop video="/a.mp4" poster="/a.webp" />);
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img")?.getAttribute("loading")).toBe("lazy");
  });

  it("mounts the video on desktop without a source until the section is near", () => {
    installMatchMedia({ [BACKGROUND_VIDEO_QUERY]: true });
    const { container } = render(<SectionBackdrop video="/a.mp4" poster="/a.webp" />);
    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    expect(video?.hasAttribute("src")).toBe(false);
  });

  it("skips the video under reduced motion", () => {
    installMatchMedia({ [BACKGROUND_VIDEO_QUERY]: true, "(prefers-reduced-motion: reduce)": true });
    const { container } = render(<SectionBackdrop video="/a.mp4" poster="/a.webp" />);
    expect(container.querySelector("video")).toBeNull();
  });

  it("omits a deferred poster from server HTML", () => {
    const html = renderToString(
      <SectionBackdrop poster="/media/about.webp" deferUntilHeroLoaded />,
    );
    expect(html).not.toContain("/media/about.webp");
  });

  it.each(["load", "error"])("releases the poster after the hero %s event", (event) => {
    installMatchMedia({ [BACKGROUND_VIDEO_QUERY]: false });
    const image = installHero(false);
    const { container } = render(
      <SectionBackdrop poster="/media/about.webp" deferUntilHeroLoaded />,
    );
    expect(container.querySelector("img")).toBeNull();
    Object.defineProperty(image, "complete", { value: true });
    fireEvent(image, new Event(event));
    expect(container.querySelector("img")).toHaveAttribute("src", "/media/about.webp");
  });

  it("releases immediately when the hero completed before hydration", () => {
    installMatchMedia({ [BACKGROUND_VIDEO_QUERY]: false });
    installHero(true);
    const { container } = render(
      <SectionBackdrop poster="/media/about.webp" deferUntilHeroLoaded />,
    );
    expect(container.querySelector("img")).toHaveAttribute("src", "/media/about.webp");
  });

  it("does not block the poster when the hero is absent", () => {
    installMatchMedia({ [BACKGROUND_VIDEO_QUERY]: false });
    const { container } = render(
      <SectionBackdrop poster="/media/about.webp" deferUntilHeroLoaded />,
    );
    expect(container.querySelector("img")).toHaveAttribute("src", "/media/about.webp");
  });

  it("keeps other posters available while the hero loads", () => {
    installMatchMedia({ [BACKGROUND_VIDEO_QUERY]: false });
    installHero(false);
    const { container } = render(<SectionBackdrop poster="/media/skills.webp" />);
    expect(container.querySelector("img")).toHaveAttribute("src", "/media/skills.webp");
  });

  it("uses a single deferred image instead of requesting a second video poster", () => {
    installMatchMedia({ [BACKGROUND_VIDEO_QUERY]: true });
    const image = installHero(false);
    const { container } = render(
      <SectionBackdrop
        video="/media/about-v2.mp4"
        poster="/media/about.webp"
        deferUntilHeroLoaded
      />,
    );
    expect(container.querySelector("video")).not.toHaveAttribute("poster");
    expect(container.querySelector("img")).toBeNull();
    Object.defineProperty(image, "complete", { value: true });
    fireEvent.load(image);
    expect(container.querySelector("video")).not.toHaveAttribute("poster");
    expect(container.querySelector("img")).toHaveAttribute("src", "/media/about.webp");
    expect(container.querySelectorAll("img")).toHaveLength(1);
  });

  it("does not preload or play a nearby video until it is visible, and pauses it after scrolling away", () => {
    installMatchMedia({ [BACKGROUND_VIDEO_QUERY]: true });
    const { container } = render(<SectionBackdrop video="/a.mp4" poster="/a.webp" />);
    const root = container.querySelector("video")!.parentElement!;
    const video = container.querySelector("video")!;
    expect(video).toHaveAttribute("preload", "none");
    expect(video).not.toHaveAttribute("autoplay");
    act(() => FakeIO.emit(root, "200px 0px", true));
    expect(video).toHaveAttribute("src", "/a.mp4");
    expect(video.play).not.toHaveBeenCalled();
    act(() => FakeIO.emit(root, "0px", true));
    expect(video.play).toHaveBeenCalledOnce();
    Object.defineProperty(video, "paused", { configurable: true, value: false });
    act(() => FakeIO.emit(root, "0px", false));
    expect(video.pause).toHaveBeenCalledOnce();
  });

  it.each(["hero first", "viewport first"])(
    "waits for both the hero and the nearby viewport (%s)",
    (order) => {
      installMatchMedia();
      const heroImage = installHero(false);
      const { container } = render(
        <SectionBackdrop poster="/media/about.webp" deferUntilHeroLoaded deferUntilNearViewport />,
      );
      const root = container.firstElementChild!.firstElementChild!;
      const finishHero = () => {
        Object.defineProperty(heroImage, "complete", { value: true });
        fireEvent.load(heroImage);
      };
      const approach = () => act(() => FakeIO.emit(root, "600px 0px", true));
      expect(container.querySelector("img")).toBeNull();
      if (order === "hero first") finishHero();
      else approach();
      expect(container.querySelector("img")).toBeNull();
      if (order === "hero first") approach();
      else finishHero();
      expect(container.querySelector("img")).toHaveAttribute("src", "/media/about.webp");
      act(() => FakeIO.emit(root, "600px 0px", false));
      expect(container.querySelectorAll("img")).toHaveLength(1);
    },
  );

  it("sizes a cover image by height on tall sections and updates after resizing", () => {
    installMatchMedia();
    let notifyResize: ResizeObserverCallback | undefined;
    const disconnect = vi.fn();
    const observe = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: ResizeObserverCallback) {
          notifyResize = callback;
        }
        observe = observe;
        disconnect = disconnect;
      },
    );
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: 360,
      height: 900,
    } as DOMRect);
    const { container, unmount } = render(
      <SectionBackdrop
        poster="/media/about.webp"
        deferUntilNearViewport
        responsivePoster={{ srcSet: "/small.webp 640w, /original.webp 1600w", aspectRatio: 16 / 9 }}
      />,
    );
    const root = container.firstElementChild!.firstElementChild!;
    expect(observe).not.toHaveBeenCalled();
    act(() => FakeIO.emit(root, "600px 0px", true));
    expect(observe).toHaveBeenCalledWith(root);
    const image = container.querySelector("img")!;
    expect(image).toHaveAttribute("sizes", "1600px");
    expect(image).toHaveAttribute("srcset", "/small.webp 640w, /original.webp 1600w");
    act(() => {
      notifyResize!(
        [{ contentRect: { width: 932, height: 200 } } as ResizeObserverEntry],
        {} as ResizeObserver,
      );
    });
    expect(image).toHaveAttribute("sizes", "932px");
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it("accounts for the landscape scale and recalculates after rotating to portrait", () => {
    const query = "(orientation: landscape) and (max-height: 500px)";
    const matchMedia = installMatchMedia({ [query]: true });
    vi.stubGlobal("ResizeObserver", undefined);
    let width = 932;
    let height = 430;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      () => ({ width, height }) as DOMRect,
    );
    const { container, unmount } = render(
      <SectionBackdrop
        poster="/media/skills.webp"
        focus="left"
        deferUntilNearViewport
        responsivePoster={{ srcSet: "/small.webp 640w, /original.webp 1536w", aspectRatio: 3 / 2 }}
      />,
    );
    const root = container.firstElementChild!.firstElementChild!;
    act(() => FakeIO.emit(root, "600px 0px", true));
    const image = container.querySelector("img")!;
    expect(image).toHaveAttribute("sizes", "1212px");

    const index = matchMedia.mock.calls.findIndex((args) => args[0] === query);
    const landscape = matchMedia.mock.results[index].value;
    landscape.matches = false;
    width = 430;
    height = 932;
    const onChange = landscape.addEventListener.mock.calls[0][1];
    act(() => onChange(new Event("change")));
    expect(image).toHaveAttribute("sizes", "1398px");
    expect(container.querySelector("img")).toBe(image);
    unmount();
    expect(landscape.removeEventListener).toHaveBeenCalledWith("change", onChange);
  });
});
