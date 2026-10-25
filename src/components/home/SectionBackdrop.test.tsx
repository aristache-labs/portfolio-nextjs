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
      <SectionBackdrop video="/media/about.mp4" poster="/media/about.webp" deferUntilHeroLoaded />,
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
});
