import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { installMatchMedia } from "@/test/matchMedia";
import { EXPRESSIVE_MOTION_QUERY, REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { ABOUT_PIN_QUERY, AboutSequence } from "./AboutSequence";
import { AboutIntroduction } from "./AboutIntroduction";
import { AboutPortraitMotion } from "./AboutPortraitMotion";
import { AboutMetric } from "./AboutMetric";

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
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function Scene() {
  return (
    <AboutSequence details={<p data-testid="details">Detailed biography</p>}>
      <AboutIntroduction text="Systems built with care." />
      <AboutPortraitMotion>
        <span>Portrait</span>
      </AboutPortraitMotion>
      <AboutMetric className="metric-first" index={0}>
        60%
      </AboutMetric>
      <AboutMetric className="metric-second" index={1}>
        1,600+
      </AboutMetric>
    </AboutSequence>
  );
}

describe("AboutSequence", () => {
  it("uses distinct stages for pinned results and keeps the full biography outside the scene", () => {
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: true, [ABOUT_PIN_QUERY]: true });
    const { container, getByTestId } = render(<Scene />);
    const first = container.querySelector<HTMLElement>(".metric-first")!;
    const second = container.querySelector<HTMLElement>(".metric-second")!;
    act(() => scroll.progress!.set(0.4));
    expect(first.style.getPropertyValue("--metric-opacity")).toBe("0.55");
    act(() => scroll.progress!.set(0.6));
    expect(Number.parseFloat(first.style.getPropertyValue("--metric-opacity"))).toBeGreaterThan(
      Number.parseFloat(second.style.getPropertyValue("--metric-opacity")),
    );
    act(() => scroll.progress!.set(1));
    expect(second.style.getPropertyValue("--metric-opacity")).toBe("1");
    const track = container.firstElementChild!;
    expect(track.contains(getByTestId("details"))).toBe(false);
  });

  it("coordinates reading, portrait and successive metrics on the same reversible timeline", () => {
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: true });
    const { container, getByText } = render(<Scene />);
    const intro = container.querySelector("p")!;
    const portrait = getByText("Portrait").parentElement!;
    const first = container.querySelector<HTMLElement>(".metric-first")!;
    const second = container.querySelector<HTMLElement>(".metric-second")!;
    act(() => scroll.progress!.set(0.3));
    expect(Number(intro.style.getPropertyValue("--intro-progress"))).toBeGreaterThan(0.8);
    expect(Number.parseFloat(portrait.style.getPropertyValue("--portrait-mask"))).toBeGreaterThan(
      0,
    );
    expect(first.style.getPropertyValue("--metric-opacity")).toBe("0.55");
    act(() => scroll.progress!.set(0.7));
    expect(portrait.style.getPropertyValue("--portrait-mask")).toBe("0%");
    expect(Number(first.style.getPropertyValue("--metric-opacity"))).toBeGreaterThan(
      Number(second.style.getPropertyValue("--metric-opacity")),
    );
    act(() => scroll.progress!.set(1));
    expect(second.style.getPropertyValue("--metric-opacity")).toBe("1");
    act(() => scroll.progress!.set(0));
    expect(intro.style.getPropertyValue("--intro-progress")).toBe("0");
    expect(portrait.style.getPropertyValue("--portrait-mask")).toBe("100%");
    expect(first).toHaveTextContent("60%");
  });

  it("hands the pinned scene off in its second half and reverses on the way back", () => {
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: true, [ABOUT_PIN_QUERY]: true });
    const { container } = render(<Scene />);
    const stage = container.firstElementChild!.firstElementChild as HTMLElement;
    act(() => scroll.progress!.set(0.5));
    expect(stage.style.getPropertyValue("--about-exit")).toBe("0");
    act(() => scroll.progress!.set(0.775));
    expect(Number(stage.style.getPropertyValue("--about-exit"))).toBeCloseTo(0.5);
    act(() => scroll.progress!.set(1));
    expect(stage.style.getPropertyValue("--about-exit")).toBe("1");
    act(() => scroll.progress!.set(0.2));
    expect(stage.style.getPropertyValue("--about-exit")).toBe("0");
  });

  it("leaves the hand-off out when the scene is not pinned", () => {
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: true });
    const { container } = render(<Scene />);
    const stage = container.firstElementChild!.firstElementChild as HTMLElement;
    act(() => scroll.progress!.set(1));
    expect(stage.style.getPropertyValue("--about-exit")).toBe("");
    expect(container.querySelector("[data-scroll-landing]")).toBeNull();
  });

  it("names an end-of-pin landing offset for menu navigation", () => {
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: true, [ABOUT_PIN_QUERY]: true });
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(862);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      height: 520,
    } as DOMRect);
    const { container } = render(<Scene />);
    const track = container.firstElementChild as HTMLElement;
    expect(track.dataset.scrollLanding).toBe("-262");
  });

  it("restores static content when reduced motion changes at runtime", () => {
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: true });
    const { container, rerender } = render(<Scene />);
    act(() => scroll.progress!.set(0.7));
    installMatchMedia({ [REDUCED_MOTION_QUERY]: true });
    rerender(<Scene />);
    expect(container.querySelector("p")!.style.getPropertyValue("--intro-progress")).toBe("");
    expect(
      (container.firstElementChild!.firstElementChild as HTMLElement).style.getPropertyValue(
        "--about-exit",
      ),
    ).toBe("");
    expect(container.querySelector<HTMLElement>(".metric-first")!.style.length).toBe(0);
    expect(container).toHaveTextContent("1,600+");
  });
});
