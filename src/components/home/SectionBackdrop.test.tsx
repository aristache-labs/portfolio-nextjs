import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { installMatchMedia } from "@/test/matchMedia";
import { DESKTOP_QUERY } from "@/hooks/useMediaQuery";
import { SectionBackdrop } from "./SectionBackdrop";

class FakeIO {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

describe("SectionBackdrop", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", FakeIO);
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
});
