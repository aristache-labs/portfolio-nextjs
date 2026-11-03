import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScrollDepth } from "./ScrollDepth";

const scroll = vi.hoisted(() => ({
  y: null as import("framer-motion").MotionValue<number> | null,
}));
vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return {
    ...actual,
    useScroll: () => {
      scroll.y = actual.useMotionValue(0);
      return { scrollY: scroll.y };
    },
  };
});

const HEIGHT = 200;
let top = 0;
let tick = 0;
const scrollTo = (frameTop: number) => {
  top = frameTop;
  // Any new value notifies the listener; the position itself comes from `top`.
  act(() => scroll.y!.set(++tick));
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ScrollDepth", () => {
  it("maps the frame position on screen from -1 to 1", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      () => ({ top, height: HEIGHT }) as DOMRect,
    );
    top = innerHeight;
    const { getByText } = render(
      <ScrollDepth enabled className="frame">
        <span>Cover</span>
      </ScrollDepth>,
    );
    const frame = getByText("Cover").parentElement!;
    expect(frame).toHaveAttribute("data-depth");
    expect(frame.style.getPropertyValue("--depth")).toBe("1.0000");
    scrollTo(innerHeight / 2 - HEIGHT / 2);
    expect(frame.style.getPropertyValue("--depth")).toBe("0.0000");
    scrollTo(-HEIGHT);
    expect(frame.style.getPropertyValue("--depth")).toBe("-1.0000");
  });

  it("is a plain frame when disabled", () => {
    const { getByText } = render(
      <ScrollDepth enabled={false} className="frame">
        <span>Cover</span>
      </ScrollDepth>,
    );
    const frame = getByText("Cover").parentElement!;
    expect(frame).toHaveClass("frame");
    expect(frame).not.toHaveAttribute("data-depth");
    expect(frame.style.getPropertyValue("--depth")).toBe("");
  });
});
