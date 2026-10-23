import { cleanup, fireEvent, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installMatchMedia } from "@/test/matchMedia";
import { DESKTOP_QUERY } from "@/hooks/useMediaQuery";
import { SectionBackdrop } from "./SectionBackdrop";

class FakeIO {
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
  });

  afterEach(() => {
    cleanup();
    hero?.remove();
    hero = undefined;
  });

  it("never mounts a video on mobile, only the lazy poster", () => {
    installMatchMedia({ [DESKTOP_QUERY]: false });
    const { container } = render(<SectionBackdrop video="/a.mp4" poster="/a.webp" />);
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img")?.getAttribute("loading")).toBe("lazy");
  });

  it("mounts the video on desktop without a source until the section is near", () => {
    installMatchMedia({ [DESKTOP_QUERY]: true });
    const { container } = render(<SectionBackdrop video="/a.mp4" poster="/a.webp" />);
    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    expect(video?.hasAttribute("src")).toBe(false);
  });

  it("skips the video under reduced motion", () => {
    installMatchMedia({ [DESKTOP_QUERY]: true, "(prefers-reduced-motion: reduce)": true });
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
    installMatchMedia({ [DESKTOP_QUERY]: false });
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
    installMatchMedia({ [DESKTOP_QUERY]: false });
    installHero(true);
    const { container } = render(
      <SectionBackdrop poster="/media/about.webp" deferUntilHeroLoaded />,
    );
    expect(container.querySelector("img")).toHaveAttribute("src", "/media/about.webp");
  });

  it("does not block the poster when the hero is absent", () => {
    installMatchMedia({ [DESKTOP_QUERY]: false });
    const { container } = render(
      <SectionBackdrop poster="/media/about.webp" deferUntilHeroLoaded />,
    );
    expect(container.querySelector("img")).toHaveAttribute("src", "/media/about.webp");
  });

  it("keeps other posters available while the hero loads", () => {
    installMatchMedia({ [DESKTOP_QUERY]: false });
    installHero(false);
    const { container } = render(<SectionBackdrop poster="/media/skills.webp" />);
    expect(container.querySelector("img")).toHaveAttribute("src", "/media/skills.webp");
  });

  it("also defers the desktop video poster", () => {
    installMatchMedia({ [DESKTOP_QUERY]: true });
    const image = installHero(false);
    const { container } = render(
      <SectionBackdrop video="/media/about.mp4" poster="/media/about.webp" deferUntilHeroLoaded />,
    );
    expect(container.querySelector("video")).not.toHaveAttribute("poster");
    expect(container.querySelector("img")).toBeNull();
    Object.defineProperty(image, "complete", { value: true });
    fireEvent.load(image);
    expect(container.querySelector("video")).toHaveAttribute("poster", "/media/about.webp");
    expect(container.querySelector("img")).toHaveAttribute("src", "/media/about.webp");
  });
});
