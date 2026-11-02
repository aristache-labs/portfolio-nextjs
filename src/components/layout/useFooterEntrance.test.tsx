import { useRef } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { footerProgress, useFooterEntrance } from "./useFooterEntrance";

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

/** 1000px of scrolling; the 400px footer starts entering at 600 and is fully up at 1000. */
const MAX_SCROLL = 1000;
const PAGE = MAX_SCROLL + innerHeight;
let tick = 0;
const scrollTo = (y: number) => {
  Object.defineProperty(window, "scrollY", { configurable: true, value: y });
  act(() => scroll.y!.set(++tick));
};

function Harness({ enabled }: { enabled: boolean }) {
  const footer = useRef<HTMLElement>(null);
  useFooterEntrance(footer, enabled);
  return (
    <footer ref={footer}>
      <div data-part="title">Thanks</div>
      <div data-part="bar">
        <a href="/privacy">Privacy</a>
      </div>
    </footer>
  );
}

const setup = (enabled = true) => {
  Object.defineProperty(document.documentElement, "scrollHeight", {
    configurable: true,
    value: PAGE,
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    () => ({ top: innerHeight - 400 + MAX_SCROLL - window.scrollY }) as DOMRect,
  );
  Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  const view = render(<Harness enabled={enabled} />);
  const part = (name: string) =>
    view.container.querySelector<HTMLElement>(`[data-part="${name}"]`)!;
  return { ...view, part };
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("footerProgress", () => {
  it("runs from the footer entering the viewport to the end of the page", () => {
    expect(footerProgress(900, 900, 500)).toBe(0);
    expect(footerProgress(700, 900, 200)).toBe(0.5);
    expect(footerProgress(500, 900, 0)).toBe(1);
    // A sub-pixel leftover at the bottom still counts as the end.
    expect(footerProgress(500, 900, 0.5)).toBe(1);
  });

  it("shows everything when the footer is already on screen without scrolling", () => {
    expect(footerProgress(300, 900, 0)).toBe(1);
  });
});

describe("useFooterEntrance", () => {
  it("brings the parts in order, ending exactly at the page end, and keeps them on the way up", () => {
    const { part } = setup();
    expect(part("title").style.getPropertyValue("--entry")).toBe("0");
    expect(part("bar").style.getPropertyValue("--entry")).toBe("0");
    scrollTo(600);
    expect(part("title").style.getPropertyValue("--entry")).toBe("0");
    // 60% through the footer's travel: the title is in, the bar has not started.
    scrollTo(840);
    expect(part("title").style.getPropertyValue("--entry")).toBe("1");
    expect(part("bar").style.getPropertyValue("--entry")).toBe("0");
    scrollTo(MAX_SCROLL);
    expect(part("bar").style.getPropertyValue("--entry")).toBe("1");
    scrollTo(0);
    expect(part("bar").style.getPropertyValue("--entry")).toBe("1");
  });

  it("lets the backdrop depth follow the scroll both ways", () => {
    const { container } = setup();
    const footer = container.querySelector("footer")!;
    scrollTo(MAX_SCROLL);
    expect(footer.style.getPropertyValue("--footer-depth")).toBe("1");
    scrollTo(800);
    expect(footer.style.getPropertyValue("--footer-depth")).toBe("0.5");
  });

  it("shows everything at once when keyboard focus moves inside", () => {
    const { part, getByRole } = setup();
    const link = getByRole("link");
    vi.spyOn(link, "matches").mockImplementation((selector) => selector === ":focus-visible");
    act(() => link.focus());
    expect(part("title").style.getPropertyValue("--entry")).toBe("1");
    expect(part("bar").style.getPropertyValue("--entry")).toBe("1");
  });

  it("keeps a pointer target in place between pointer down and click", () => {
    const { part, getByRole } = setup();
    scrollTo(900);
    const before = part("bar").style.getPropertyValue("--entry");
    const link = getByRole("link");
    vi.spyOn(link, "matches").mockReturnValue(false);
    act(() => link.focus());
    expect(part("bar").style.getPropertyValue("--entry")).toBe(before);
  });

  it("never hides anything when disabled", () => {
    const { part } = setup(false);
    expect(part("title").style.getPropertyValue("--entry")).toBe("");
  });
});
