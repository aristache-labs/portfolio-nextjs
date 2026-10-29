import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { installMatchMedia } from "@/test/matchMedia";
import { EXPRESSIVE_MOTION_QUERY, REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { AboutPortraitMotion } from "./AboutPortraitMotion";

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

describe("AboutPortraitMotion", () => {
  it("reveals the image with scroll while leaving the layout frame stationary", () => {
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: true });
    const { container } = render(<AboutPortraitMotion>Portrait</AboutPortraitMotion>);
    const frame = container.firstElementChild!;
    const reveal = frame.firstElementChild as HTMLElement;
    act(() => scroll.progress!.set(0.1));
    expect(Number.parseFloat(reveal.style.getPropertyValue("--portrait-mask"))).toBeCloseTo(88.24);
    act(() => scroll.progress!.set(0.5));
    expect(Number.parseFloat(reveal.style.getPropertyValue("--portrait-mask"))).toBeCloseTo(41.18);
    expect(reveal.style.getPropertyValue("--portrait-image-y")).toBe("0%");
    expect(Number(reveal.style.getPropertyValue("--portrait-image-scale"))).toBeCloseTo(1.14);
    act(() => scroll.progress!.set(0.85));
    expect(reveal.style.getPropertyValue("--portrait-mask")).toBe("0%");
    act(() => scroll.progress!.set(0.5));
    expect(Number.parseFloat(reveal.style.getPropertyValue("--portrait-mask"))).toBeCloseTo(41.18);
    expect(frame).not.toHaveAttribute("style");
  });

  it("reduces movement on touch and removes it when reduced motion is selected", () => {
    installMatchMedia();
    const { container, rerender } = render(<AboutPortraitMotion>Portrait</AboutPortraitMotion>);
    const reveal = container.firstElementChild!.firstElementChild as HTMLElement;
    act(() => scroll.progress!.set(1));
    expect(reveal.style.getPropertyValue("--portrait-image-y")).toBe("-1.5%");
    expect(reveal.style.getPropertyValue("--portrait-image-scale")).toBe("1.04");
    installMatchMedia({ [REDUCED_MOTION_QUERY]: true });
    rerender(<AboutPortraitMotion>Portrait</AboutPortraitMotion>);
    act(() => scroll.progress!.set(0));
    expect(reveal.style.length).toBe(0);
  });
});
