import { act, cleanup, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { installMatchMedia } from "@/test/matchMedia";
import { REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { AboutIntroduction } from "./AboutIntroduction";

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

describe("AboutIntroduction", () => {
  it("preserves readable server text without duplicating the sentence", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<AboutIntroduction text="Systems built with care." />);
    expect(container.textContent).toBe("Systems built with care.");
    expect(container.querySelector("p")?.style.getPropertyValue("--intro-progress")).toBe("");
  });

  it("reverses reading progress and removes animation values for reduced motion", () => {
    installMatchMedia();
    const { container, rerender } = render(<AboutIntroduction text="Systems built with care." />);
    const paragraph = container.querySelector("p")!;
    act(() => scroll.progress!.set(0.75));
    expect(paragraph.style.getPropertyValue("--intro-progress")).toBe("0.75");
    act(() => scroll.progress!.set(0.25));
    expect(paragraph.style.getPropertyValue("--intro-progress")).toBe("0.25");
    installMatchMedia({ [REDUCED_MOTION_QUERY]: true });
    rerender(<AboutIntroduction text="Systems built with care." />);
    expect(paragraph.style.getPropertyValue("--intro-progress")).toBe("");
    expect(paragraph).toHaveTextContent("Systems built with care.");
  });
});
