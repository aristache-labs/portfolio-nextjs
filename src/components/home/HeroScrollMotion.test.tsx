import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeroScrollMotion } from "./HeroScrollMotion";
import styles from "./hero-motion.module.css";

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

beforeEach(() => vi.stubGlobal("matchMedia", () => ({ matches: false })));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** The element each variable lands on; every rule that reads it sits on or under this class. */
const TARGET: Record<string, keyof typeof styles> = {
  "media-y": "scrollMedia",
  "media-scale": "scrollMedia",
  "light-progress": "scrollCue",
  handoff: "handoff",
  "exit-actions": "exitActions",
  "exit-details": "exitDetails",
  "exit-specialization": "specialization",
  "exit-title": "exitTitle",
};

const makeSection = () => {
  const section = document.createElement("section");
  for (const key of new Set(Object.values(TARGET))) {
    section.appendChild(document.createElement("div")).className = styles[key];
  }
  return section;
};

const read = (node: HTMLElement, name: string) =>
  node
    .querySelector<HTMLElement>(`.${styles[TARGET[name]]}`)!
    .style.getPropertyValue(`--hero-${name}`);

const exit = (node: HTMLElement, name: string) => Number(read(node, `exit-${name}`));

describe("HeroScrollMotion", () => {
  it("reverses the touch handoff when scrolling back to the top", () => {
    const node = makeSection();
    render(<HeroScrollMotion section={{ current: node }} expressive={false} variant="touch" />);

    act(() => scroll.progress!.set(0.54));
    expect(exit(node, "actions")).toBeGreaterThan(exit(node, "details"));
    expect(exit(node, "title")).toBe(0);

    act(() => scroll.progress!.set(0));
    expect(exit(node, "actions")).toBe(0);
  });

  it("opens the pinned scene while keeping enough image coverage for its upward movement", () => {
    const section = { current: makeSection() };
    render(<HeroScrollMotion section={section} expressive variant="desktop" />);
    act(() => scroll.progress!.set(0.5));
    expect(read(section.current, "media-y")).toBe("-0.75%");
    expect(read(section.current, "media-scale")).toBe("1.02");
    act(() => scroll.progress!.set(0));
    expect(read(section.current, "media-scale")).toBe("1");
    expect(read(section.current, "exit-title")).toBe("0");
    expect(read(section.current, "handoff")).toBe("0");
  });

  it("clears the desktop scene from the bottom up, leaving the name until last", () => {
    const section = { current: makeSection() };
    render(<HeroScrollMotion section={section} expressive variant="desktop" />);
    const node = section.current;
    act(() => scroll.progress!.set(0.3));
    expect(exit(node, "actions")).toBe(0);
    act(() => scroll.progress!.set(0.5));
    expect(exit(node, "actions")).toBeGreaterThan(exit(node, "details"));
    expect(exit(node, "details")).toBeGreaterThan(exit(node, "specialization"));
    expect(exit(node, "title")).toBe(0);
    act(() => scroll.progress!.set(0.67));
    expect(exit(node, "actions")).toBe(1);
    expect(exit(node, "title")).toBeGreaterThan(0);
    expect(exit(node, "title")).toBeLessThan(0.1);
    expect(Number(read(node, "handoff"))).toBeGreaterThan(0.5);
    act(() => scroll.progress!.set(1));
    expect(exit(node, "title")).toBe(1);
    expect(read(node, "handoff")).toBe("1");
  });

  it("clears the touch scene from the bottom up on its own timings", () => {
    const section = { current: makeSection() };
    render(<HeroScrollMotion section={section} expressive={false} variant="touch" />);
    const node = section.current;
    act(() => scroll.progress!.set(0.45));
    expect(exit(node, "actions")).toBe(0);
    expect(exit(node, "details")).toBe(0);
    act(() => scroll.progress!.set(0.6));
    expect(exit(node, "actions")).toBeGreaterThan(exit(node, "details"));
    expect(exit(node, "details")).toBeGreaterThan(exit(node, "specialization"));
    expect(exit(node, "title")).toBe(0);
    act(() => scroll.progress!.set(0.86));
    expect(exit(node, "actions")).toBe(1);
    expect(exit(node, "title")).toBeLessThan(1);
  });

  it("replaces the desktop handoff curve when the scene switches to touch", () => {
    const section = { current: makeSection() };
    const { rerender } = render(
      <HeroScrollMotion section={section} expressive variant="desktop" />,
    );
    act(() => scroll.progress!.set(0.6));
    expect(Number(read(section.current, "handoff"))).toBeGreaterThan(0.5);
    rerender(<HeroScrollMotion section={section} expressive={false} variant="touch" />);
    act(() => scroll.progress!.set(0.5));
    expect(Number(read(section.current, "handoff"))).toBeCloseTo(0.369, 3);
    expect(exit(section.current, "title")).toBe(0);
    expect(exit(section.current, "specialization")).toBe(0);
  });

  it("reverses the desktop scene when scrolling back to the top", () => {
    const section = { current: makeSection() };
    render(<HeroScrollMotion section={section} expressive />);
    act(() => scroll.progress!.set(1));
    expect(read(section.current, "media-y")).toBe("-1.5%");
    expect(read(section.current, "media-scale")).toBe("1.04");
    expect(read(section.current, "handoff")).toBe("");
    act(() => scroll.progress!.set(0));
    expect(read(section.current, "media-y")).toBe("0%");
  });

  it("caps the smaller touch parallax after leaving the hero", () => {
    const section = { current: makeSection() };
    render(<HeroScrollMotion section={section} expressive={false} />);
    act(() => scroll.progress!.set(2));
    expect(read(section.current, "media-y")).toBe("-0.5%");
  });

  it("restores static styles and stops updates when motion is disabled", () => {
    const section = { current: makeSection() };
    const { unmount } = render(<HeroScrollMotion section={section} expressive variant="desktop" />);
    act(() => scroll.progress!.set(0.75));
    // Nothing lands on the section itself, so a scroll frame never restyles the whole scene.
    expect(section.current.style.length).toBe(0);
    unmount();
    act(() => scroll.progress!.set(1));
    for (const child of section.current.children) {
      expect((child as HTMLElement).style.length).toBe(0);
    }
  });
});
