import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScrollEntrance } from "./ScrollEntrance";

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

let top = 0;
let tick = 0;
/** Element top that puts it `travelled` viewports past the 95% starting line. */
const topAt = (travelled: number) => (0.95 - travelled) * innerHeight;
const scrollTo = (travelled: number) => {
  top = topAt(travelled);
  // Any new value notifies the listener; the position itself comes from `top`.
  act(() => scroll.y!.set(++tick));
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ScrollEntrance", () => {
  it("enters from its own position and stays when scrolling back up", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      () => ({ top }) as DOMRect,
    );
    top = topAt(-0.5);
    const { getByText } = render(
      <ScrollEntrance enabled from="left">
        <span>Card</span>
      </ScrollEntrance>,
    );
    const entrance = getByText("Card").parentElement!;
    expect(entrance).toHaveAttribute("data-from", "left");
    expect(entrance.style.getPropertyValue("--entry")).toBe("0");
    scrollTo(0.175);
    expect(Number(entrance.style.getPropertyValue("--entry"))).toBeCloseTo(0.5);
    scrollTo(1);
    expect(entrance.style.getPropertyValue("--entry")).toBe("1");
    scrollTo(-1);
    expect(entrance.style.getPropertyValue("--entry")).toBe("1");
  });

  it("waits a little longer with a lag", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      () => ({ top }) as DOMRect,
    );
    top = topAt(-0.5);
    const { getByText } = render(
      <ScrollEntrance enabled from="right" lag={0.1}>
        <span>Card</span>
      </ScrollEntrance>,
    );
    const entrance = getByText("Card").parentElement!;
    scrollTo(0.1);
    expect(entrance.style.getPropertyValue("--entry")).toBe("0");
    scrollTo(0.275);
    expect(Number(entrance.style.getPropertyValue("--entry"))).toBeCloseTo(0.5);
  });

  it("never hides anything when disabled", () => {
    const { getByText } = render(
      <ScrollEntrance enabled={false} from="below" className="h-full">
        <span>Card</span>
      </ScrollEntrance>,
    );
    const entrance = getByText("Card").parentElement!;
    expect(entrance).not.toHaveAttribute("data-from");
    expect(entrance).toHaveClass("h-full");
    expect(entrance.style.getPropertyValue("--entry")).toBe("");
  });
});
