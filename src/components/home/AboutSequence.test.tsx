import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { installMatchMedia } from "@/test/matchMedia";
import { EXPRESSIVE_MOTION_QUERY, REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { ABOUT_PIN_QUERY, AboutSequence } from "./AboutSequence";
import { AboutIntroduction } from "./AboutIntroduction";
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
    </AboutSequence>
  );
}

describe("AboutSequence", () => {
  it("reads and reveals the pinned scene before the hand-off and keeps the biography outside", () => {
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: true, [ABOUT_PIN_QUERY]: true });
    const { container, getByTestId, getByText } = render(<Scene />);
    const intro = container.querySelector("p")!;
    const portrait = getByText("Portrait").parentElement!;
    act(() => scroll.progress!.set(0.2));
    expect(Number(intro.style.getPropertyValue("--intro-progress"))).toBeLessThan(1);
    expect(Number.parseFloat(portrait.style.getPropertyValue("--portrait-mask"))).toBeGreaterThan(
      0,
    );
    act(() => scroll.progress!.set(0.5));
    expect(intro.style.getPropertyValue("--intro-progress")).toBe("1");
    expect(portrait.style.getPropertyValue("--portrait-mask")).toBe("0%");
    const track = container.firstElementChild!;
    expect(track.contains(getByTestId("details"))).toBe(false);
  });

  it("coordinates reading and portrait on the same reversible timeline", () => {
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: true });
    const { container, getByText } = render(<Scene />);
    const intro = container.querySelector("p")!;
    const portrait = getByText("Portrait").parentElement!;
    act(() => scroll.progress!.set(0.3));
    expect(Number(intro.style.getPropertyValue("--intro-progress"))).toBeGreaterThan(0.8);
    expect(Number.parseFloat(portrait.style.getPropertyValue("--portrait-mask"))).toBeGreaterThan(
      0,
    );
    act(() => scroll.progress!.set(0.7));
    expect(portrait.style.getPropertyValue("--portrait-mask")).toBe("0%");
    act(() => scroll.progress!.set(0));
    expect(intro.style.getPropertyValue("--intro-progress")).toBe("0");
    expect(portrait.style.getPropertyValue("--portrait-mask")).toBe("100%");
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

  it("drives the detailed biography from the same hand-off progress", () => {
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: true, [ABOUT_PIN_QUERY]: true });
    const { getByTestId } = render(<Scene />);
    const details = getByTestId("details").parentElement!;
    act(() => scroll.progress!.set(0.5));
    expect(details.style.getPropertyValue("--about-exit")).toBe("0");
    act(() => scroll.progress!.set(1));
    expect(details.style.getPropertyValue("--about-exit")).toBe("1");
  });

  it("leaves the hand-off out when the scene is not pinned", () => {
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: true });
    const { container } = render(<Scene />);
    const stage = container.firstElementChild!.firstElementChild as HTMLElement;
    act(() => scroll.progress!.set(1));
    expect(stage.style.getPropertyValue("--about-exit")).toBe("");
    expect(container.lastElementChild!.getAttribute("style")).toBeNull();
    expect(container.querySelector("[data-scroll-landing]")).toBeNull();
  });

  it("marks which biography column each paragraph sits in", () => {
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: true, [ABOUT_PIN_QUERY]: true });
    vi.spyOn(HTMLElement.prototype, "offsetParent", "get").mockReturnValue(document.body);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement,
    ) {
      return { left: this.textContent === "Right" ? 600 : 200 } as DOMRect;
    });
    const { getByText } = render(
      <AboutSequence
        details={
          <div>
            <p>Left</p>
            <p>Right</p>
          </div>
        }
      >
        <span>Scene</span>
      </AboutSequence>,
    );
    expect(getByText("Left").style.getPropertyValue("--column-index")).toBe("0");
    expect(getByText("Right").style.getPropertyValue("--column-index")).toBe("1");
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
    expect(container).toHaveTextContent("Systems built with care.");
  });
});
