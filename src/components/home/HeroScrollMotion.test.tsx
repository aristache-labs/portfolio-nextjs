import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HeroScrollMotion } from "./HeroScrollMotion";

const scroll = vi.hoisted(() => ({
  progress: null as import("framer-motion").MotionValue<number> | null,
}));

vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return {
    ...actual,
    useScroll: () => {
      scroll.progress = actual.useMotionValue(0);
      return { scrollYProgress: scroll.progress };
    },
  };
});

afterEach(cleanup);

describe("HeroScrollMotion", () => {
  it("opens the pinned scene while keeping enough image coverage for its upward movement", () => {
    const section = { current: document.createElement("section") };
    render(<HeroScrollMotion section={section} expressive pinned />);
    act(() => scroll.progress!.set(0.5));
    expect(section.current.style.getPropertyValue("--hero-media-y")).toBe("-1%");
    expect(section.current.style.getPropertyValue("--hero-media-scale")).toBe("1.04");
    expect(Number(section.current.style.getPropertyValue("--hero-copy-opacity"))).toBeCloseTo(0.5);
    act(() => scroll.progress!.set(0));
    expect(section.current.style.getPropertyValue("--hero-media-scale")).toBe("1");
    expect(section.current.style.getPropertyValue("--hero-copy-opacity")).toBe("1");
  });

  it("reverses the desktop scene when scrolling back to the top", () => {
    const section = { current: document.createElement("section") };
    render(<HeroScrollMotion section={section} expressive />);
    act(() => scroll.progress!.set(1));
    expect(section.current.style.getPropertyValue("--hero-media-y")).toBe("18%");
    expect(section.current.style.getPropertyValue("--hero-media-scale")).toBe("1.06");
    expect(section.current.style.getPropertyValue("--hero-copy-opacity")).toBe("0");
    act(() => scroll.progress!.set(0));
    expect(section.current.style.getPropertyValue("--hero-media-y")).toBe("0%");
    expect(section.current.style.getPropertyValue("--hero-copy-opacity")).toBe("1");
  });

  it("keeps touch copy visible and caps motion after leaving the hero", () => {
    const section = { current: document.createElement("section") };
    render(<HeroScrollMotion section={section} expressive={false} />);
    act(() => scroll.progress!.set(2));
    expect(section.current.style.getPropertyValue("--hero-media-y")).toBe("5%");
    expect(section.current.style.getPropertyValue("--hero-copy-y")).toBe("-12px");
    expect(section.current.style.getPropertyValue("--hero-copy-opacity")).toBe("1");
  });

  it("restores static styles and stops updates when motion is disabled", () => {
    const section = { current: document.createElement("section") };
    const { unmount } = render(<HeroScrollMotion section={section} expressive />);
    act(() => scroll.progress!.set(0.75));
    unmount();
    act(() => scroll.progress!.set(1));
    expect(section.current.style.length).toBe(0);
  });
});
