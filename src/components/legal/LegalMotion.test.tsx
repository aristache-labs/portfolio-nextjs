import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EXPRESSIVE_MOTION_QUERY, REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { PINNED_SCENE_QUERY } from "@/hooks/useMediaQuery";
import { installMatchMedia } from "@/test/matchMedia";
import {
  LEGAL_MOBILE_QUERY,
  LegalContents,
  LegalHeaderScene,
  LegalReveal,
  legalSceneProgress,
} from "./LegalMotion";

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

let tick = 0;
const scrollTo = (y: number) => {
  Object.defineProperty(window, "scrollY", { configurable: true, value: y });
  act(() => scroll.y!.set(++tick));
};

const expressive = () =>
  installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: true, [PINNED_SCENE_QUERY]: true });

beforeEach(() => {
  Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("mobile legal motion", () => {
  const observers = new Map<Element, IntersectionObserverCallback>();
  beforeEach(() => {
    observers.clear();
    installMatchMedia({ [LEGAL_MOBILE_QUERY]: true });
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(private callback: IntersectionObserverCallback) {}
        observe(target: Element) {
          observers.set(target, this.callback);
        }
        disconnect() {}
      },
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("reveals reading blocks individually without pinning the mobile header", () => {
    const { container } = render(
      <>
        <LegalHeaderScene>
          <h1>Title</h1>
        </LegalHeaderScene>
        <LegalReveal>
          <section>First paragraph</section>
        </LegalReveal>
        <LegalReveal>
          <section>Second paragraph</section>
        </LegalReveal>
      </>,
    );
    const first = screen.getByText("First paragraph").parentElement!;
    const second = screen.getByText("Second paragraph").parentElement!;
    const bounds = first.getBoundingClientRect();
    act(() =>
      observers.get(first)!(
        [
          {
            target: first,
            isIntersecting: true,
            intersectionRatio: 1,
            boundingClientRect: bounds,
            intersectionRect: bounds,
            rootBounds: null,
            time: 0,
          },
        ],
        {} as IntersectionObserver,
      ),
    );
    expect(first).toHaveAttribute("data-legal-reveal", "play");
    expect(second).toHaveAttribute("data-legal-reveal", "armed");
    expect(container.querySelector("[data-legal-scene]")).toBeNull();
    expect(container.querySelector(".sticky")).toBeNull();
  });

  it("settles a legal block immediately when one of its links is focused", () => {
    render(
      <LegalReveal>
        <a href="mailto:privacy@example.com">Contact</a>
      </LegalReveal>,
    );
    const link = screen.getByRole("link");
    fireEvent.focusIn(link);
    expect(link.parentElement).toHaveAttribute("data-legal-reveal", "static");
  });

  it("keeps legal content visible with reduced motion", () => {
    installMatchMedia({ [LEGAL_MOBILE_QUERY]: true, [REDUCED_MOTION_QUERY]: true });
    const { container } = render(
      <LegalReveal>
        <p>Readable policy</p>
      </LegalReveal>,
    );
    expect(container.querySelector("[data-legal-reveal]")).toBeNull();
    expect(screen.getByText("Readable policy")).toBeVisible();
  });
});

describe("legalSceneProgress", () => {
  it("runs from the top of the page to the end of the travel", () => {
    expect(legalSceneProgress(0, 400)).toBe(0);
    expect(legalSceneProgress(200, 400)).toBe(0.5);
    expect(legalSceneProgress(900, 400)).toBe(1);
  });
});

describe("LegalHeaderScene", () => {
  it("renders plain markup without the pinned scene", () => {
    installMatchMedia();
    const { container } = render(
      <LegalHeaderScene>
        <h1>Title</h1>
      </LegalHeaderScene>,
    );
    expect(container.querySelector("[data-legal-scene]")).toBeNull();
    expect(screen.getByRole("heading")).toBeVisible();
    expect(container.querySelector(".sticky")).toBeNull();
  });

  it("pins the header and fades it as the page scrolls", () => {
    expressive();
    const { container } = render(
      <LegalHeaderScene>
        <h1>Title</h1>
      </LegalHeaderScene>,
    );
    const header = screen.getByRole("heading").parentElement as HTMLElement;
    expect(container.querySelector("[data-legal-scene]")).not.toBeNull();
    expect(header.className).toContain("sticky");
    expect(header.style.opacity).toBe("1");
    scrollTo(5000);
    expect(header.style.opacity).toBe("0");
  });
});

describe("LegalReveal", () => {
  it("only hides content when the scene is enabled", () => {
    installMatchMedia();
    const { container, unmount } = render(
      <LegalReveal>
        <p>Body</p>
      </LegalReveal>,
    );
    expect(container.querySelector("[data-from]")).toBeNull();
    unmount();
    expressive();
    const view = render(
      <LegalReveal>
        <p>Body</p>
      </LegalReveal>,
    );
    expect(view.container.querySelector('[data-from="below"]')).not.toBeNull();
  });
});

describe("LegalContents", () => {
  it("marks the section being read as the current location", () => {
    installMatchMedia();
    const tops: Record<string, number> = { first: -400, second: 300 };
    vi.spyOn(document, "getElementById").mockImplementation(
      (id) => ({ getBoundingClientRect: () => ({ top: tops[id] }) }) as HTMLElement,
    );
    render(
      <LegalContents
        label="Test contents"
        items={[
          { id: "first", label: "First" },
          { id: "second", label: "Second" },
        ]}
      />,
    );
    const current = screen
      .getAllByRole("link", { name: "First" })
      .filter((link) => link.getAttribute("aria-current") === "location");
    expect(current.length).toBeGreaterThan(0);
    expect(
      screen
        .getAllByRole("link", { name: "Second" })
        .some((link) => link.hasAttribute("aria-current")),
    ).toBe(false);
  });
});
