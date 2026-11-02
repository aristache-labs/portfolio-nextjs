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

const exit = (node: HTMLElement, name: string) =>
  Number(node.style.getPropertyValue(`--hero-exit-${name}`));

describe("HeroScrollMotion", () => {
  it("opens the pinned scene while keeping enough image coverage for its upward movement", () => {
    const section = { current: document.createElement("section") };
    render(<HeroScrollMotion section={section} expressive variant="desktop" />);
    act(() => scroll.progress!.set(0.5));
    expect(section.current.style.getPropertyValue("--hero-media-y")).toBe("-1%");
    expect(section.current.style.getPropertyValue("--hero-media-scale")).toBe("1.05");
    expect(section.current.style.getPropertyValue("--hero-copy-opacity")).toBe("1");
    act(() => scroll.progress!.set(0));
    expect(section.current.style.getPropertyValue("--hero-media-scale")).toBe("1");
    expect(section.current.style.getPropertyValue("--hero-exit-title")).toBe("0");
    expect(section.current.style.getPropertyValue("--hero-handoff")).toBe("0");
  });

  it("clears the desktop scene from the bottom up, leaving the name until last", () => {
    const section = { current: document.createElement("section") };
    render(<HeroScrollMotion section={section} expressive variant="desktop" />);
    act(() => scroll.progress!.set(0.3));
    const node = section.current;
    expect(exit(node, "actions")).toBeGreaterThan(exit(node, "details"));
    expect(exit(node, "details")).toBeGreaterThan(exit(node, "specialization"));
    expect(exit(node, "title")).toBe(0);
    act(() => scroll.progress!.set(0.6));
    expect(exit(node, "actions")).toBe(1);
    expect(exit(node, "title")).toBeGreaterThan(0);
    expect(exit(node, "title")).toBeLessThan(0.1);
    // The plate darkens as the copy leaves, so it never holds the stage alone.
    expect(Number(node.style.getPropertyValue("--hero-handoff"))).toBeGreaterThan(0.5);
    act(() => scroll.progress!.set(1));
    expect(exit(node, "title")).toBe(1);
    expect(node.style.getPropertyValue("--hero-handoff")).toBe("1");
  });

  it("clears the touch scene from the bottom up on its own timings", () => {
    const section = { current: document.createElement("section") };
    render(<HeroScrollMotion section={section} expressive={false} variant="touch" />);
    const node = section.current;
    const expected: [number, Record<string, number>][] = [
      [0.3, { actions: 0.7681, details: 0.2858, specialization: 0, title: 0, handoff: 0.0383 }],
      [0.5, { actions: 1, details: 0.99, specialization: 0.5, title: 0, handoff: 0.369 }],
      [0.8, { actions: 1, details: 1, specialization: 1, title: 0.5357, handoff: 0.9415 }],
    ];
    for (const [progress, values] of expected) {
      act(() => scroll.progress!.set(progress));
      for (const [name, value] of Object.entries(values)) {
        const property = name === "handoff" ? "--hero-handoff" : `--hero-exit-${name}`;
        expect(Number(node.style.getPropertyValue(property))).toBeCloseTo(value, 3);
      }
    }
  });

  it("replaces the desktop handoff curve when the scene switches to touch", () => {
    const section = { current: document.createElement("section") };
    const { rerender } = render(
      <HeroScrollMotion section={section} expressive variant="desktop" />,
    );
    act(() => scroll.progress!.set(0.6));
    expect(Number(section.current.style.getPropertyValue("--hero-handoff"))).toBeGreaterThan(0.5);
    rerender(<HeroScrollMotion section={section} expressive={false} variant="touch" />);
    act(() => scroll.progress!.set(0.5));
    expect(Number(section.current.style.getPropertyValue("--hero-handoff"))).toBeCloseTo(0.369, 3);
    expect(exit(section.current, "title")).toBe(0);
    expect(exit(section.current, "specialization")).toBeCloseTo(0.5, 3);
  });

  it("reverses the desktop scene when scrolling back to the top", () => {
    const section = { current: document.createElement("section") };
    render(<HeroScrollMotion section={section} expressive />);
    act(() => scroll.progress!.set(1));
    expect(section.current.style.getPropertyValue("--hero-media-y")).toBe("18%");
    expect(section.current.style.getPropertyValue("--hero-media-scale")).toBe("1.06");
    expect(section.current.style.getPropertyValue("--hero-copy-opacity")).toBe("0");
    expect(section.current.style.getPropertyValue("--hero-handoff")).toBe("");
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
    const { unmount } = render(<HeroScrollMotion section={section} expressive variant="desktop" />);
    act(() => scroll.progress!.set(0.75));
    unmount();
    act(() => scroll.progress!.set(1));
    expect(section.current.style.length).toBe(0);
  });
});
