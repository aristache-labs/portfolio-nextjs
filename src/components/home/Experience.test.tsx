import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Experience } from "./Experience";
import type { ExperienceRow } from "@/lib/queries";
import { installMatchMedia } from "@/test/matchMedia";
import { EXPRESSIVE_MOTION_QUERY, REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { renderToString } from "react-dom/server";
import styles from "./experience-layout.module.css";

const scrollHook = vi.hoisted(() => vi.fn());
const scrollProgress = vi.hoisted(() => ({
  current: null as import("framer-motion").MotionValue<number> | null,
}));
vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return {
    ...actual,
    useSpring: (value: import("framer-motion").MotionValue<number>) => value,
    useScroll: (options: unknown) => {
      scrollHook(options);
      const progress = actual.useMotionValue(0);
      scrollProgress.current = progress;
      return { scrollYProgress: progress };
    },
  };
});
const mockExperiences: ExperienceRow[] = [
  {
    id: 1,
    role: "Senior Software Engineer",
    org: "Acme Corp",
    period: "2022 – Present",
    location: "Remote",
    isCurrent: true,
    description: ["Built scalable APIs", "Led team of 5 engineers"],
    order: 1,
  },
  {
    id: 2,
    role: "Software Engineer",
    org: "Beta Inc",
    period: "2020 – 2022",
    location: "New York",
    isCurrent: false,
    description: ["Developed React apps", "Improved test coverage"],
    order: 2,
  },
];

describe("Experience", () => {
  it("groups the numbered section label and title in one entrance", () => {
    render(<Experience experiences={mockExperiences} />);
    const title = screen.getByRole("heading", { name: "Where I've worked" });
    expect(title.parentElement).toHaveClass("mb-5");
    expect(title.parentElement?.querySelector("p")).toHaveTextContent("03Experience");
    expect(title.parentElement?.querySelector("h2")).toBe(title);
  });

  it.each([
    ["desktop", true, 1440, 900],
    ["mobile portrait", false, 430, 932],
    ["mobile landscape", false, 932, 430],
  ])("fills stationary dots as the rail crosses them on %s", (_profile, desktop, width, height) => {
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: desktop });
    vi.stubGlobal("innerWidth", width);
    vi.stubGlobal("innerHeight", height);
    let scale = height < 500 ? 11 / 16 : 1;
    const trackTop = vi
      .spyOn(HTMLElement.prototype, "offsetTop", "get")
      .mockImplementation(function (this: HTMLElement) {
        return this.hasAttribute("data-timeline-track") ? 24 * scale : 0;
      });
    const trackHeight = vi
      .spyOn(HTMLElement.prototype, "offsetHeight", "get")
      .mockImplementation(function (this: HTMLElement) {
        return this.hasAttribute("data-timeline-track") ? 1000 * scale : 0;
      });
    const bounds = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        if (this.hasAttribute("data-timeline-dot")) {
          const top = this.hasAttribute("data-timeline-end")
            ? 1018
            : this.closest("li")?.dataset.experienceId === "1"
              ? 18
              : 518;
          return { top: top * scale, height: 12 * scale } as DOMRect;
        }
        return { top: 0, height: 1048 * scale } as DOMRect;
      });
    const { container, rerender, unmount } = render(<Experience experiences={mockExperiences} />);
    try {
      const dots = container.querySelectorAll("[data-timeline-dot]");
      expect(dots).toHaveLength(3);
      expect(dots[2]).toHaveAttribute("data-timeline-end");
      expect(dots[2]).toHaveAttribute("aria-hidden");
      for (const dot of dots) expect(dot).toHaveClass(styles.marker);
      expect(dots[0].parentElement).toBe(container.querySelector("ol > li"));
      expect(dots[2].parentElement).toBe(container.querySelector("ol")?.parentElement);
      expect(container.getElementsByClassName(styles.rail)).toHaveLength(3);
      bounds.mockClear();
      act(() => scrollProgress.current!.set(0.49));
      expect(dots[0]).toHaveAttribute("data-timeline-filled");
      expect(dots[1]).not.toHaveAttribute("data-timeline-filled");
      act(() => scrollProgress.current!.set(0.5));
      expect(dots[1]).toHaveAttribute("data-timeline-filled");
      expect(dots[2]).not.toHaveAttribute("data-timeline-filled");
      act(() => scrollProgress.current!.set(1));
      expect(dots[2]).toHaveAttribute("data-timeline-filled");
      act(() => scrollProgress.current!.set(0.25));
      expect(dots[1]).not.toHaveAttribute("data-timeline-filled");
      expect(dots[2]).not.toHaveAttribute("data-timeline-filled");
      expect(bounds).not.toHaveBeenCalled();
      scale = scale === 1 ? 11 / 16 : 1;
      act(() => window.dispatchEvent(new Event("resize")));
      expect(dots[0]).toHaveAttribute("data-timeline-filled");
      act(() => scrollProgress.current!.set(0.49));
      expect(dots[1]).not.toHaveAttribute("data-timeline-filled");
      act(() => scrollProgress.current!.set(0.5));
      expect(dots[1]).toHaveAttribute("data-timeline-filled");
      installMatchMedia({ [REDUCED_MOTION_QUERY]: true });
      rerender(<Experience experiences={mockExperiences} />);
      expect(container.querySelector("[data-timeline-filled]")).toBeNull();
    } finally {
      unmount();
      bounds.mockRestore();
      trackTop.mockRestore();
      trackHeight.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  beforeEach(() => {
    scrollHook.mockClear();
    installMatchMedia();
  });

  it("renders experience roles", () => {
    render(<Experience experiences={mockExperiences} />);
    expect(screen.getByText("Senior Software Engineer")).toBeInTheDocument();
    expect(screen.getByText("Software Engineer")).toBeInTheDocument();
  });

  it("serves visible headings and ordered entries before hydration", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(
      <Experience experiences={[...mockExperiences].reverse()} />,
    );
    expect(container.querySelectorAll("ol > li")).toHaveLength(2);
    expect(container.querySelector("ol h3")).toHaveTextContent("Senior Software Engineer");
    for (const element of container.querySelectorAll("h2, h3")) {
      for (let node: Element | null = element; node; node = node.parentElement) {
        expect((node as HTMLElement).style.opacity).not.toBe("0");
      }
    }
    expect(scrollHook).not.toHaveBeenCalled();
  });

  it("animates the rail on touch devices even with a desktop-width layout", () => {
    installMatchMedia({ "(min-width: 1024px)": true });
    const { container } = render(<Experience experiences={mockExperiences} />);
    expect(scrollHook).toHaveBeenCalled();
    expect(container.querySelector("[data-timeline-active]")).toBeNull();
    expect(screen.getByText("Led team of 5 engineers")).toBeVisible();
  });

  it.each([
    ["desktop", true, 1440, 900],
    ["mobile portrait", false, 430, 932],
    ["mobile landscape", false, 932, 430],
  ])("mounts the scroll rail on %s", (_profile, desktop, width, height) => {
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: desktop });
    vi.stubGlobal("innerWidth", width);
    vi.stubGlobal("innerHeight", height);
    try {
      const { container } = render(<Experience experiences={mockExperiences} />);
      expect(scrollHook).toHaveBeenCalledWith(
        expect.objectContaining({ offset: ["start 70%", "end 60%"], trackContentSize: true }),
      );
      expect(scrollHook.mock.calls[0][0].target.current).toBe(
        container.querySelector("ol")?.parentElement,
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("keeps the mobile rail mounted through rotation and removes it for reduced motion", () => {
    const { container, rerender } = render(<Experience experiences={mockExperiences} />);
    const rail = container.querySelector(".origin-top");
    expect(rail).not.toBeNull();
    act(() => window.dispatchEvent(new Event("resize")));
    rerender(<Experience experiences={[...mockExperiences]} />);
    expect(container.querySelector(".origin-top")).toBe(rail);
    installMatchMedia({ [REDUCED_MOTION_QUERY]: true });
    rerender(<Experience experiences={[...mockExperiences]} />);
    expect(container.querySelector(".origin-top")).toBeNull();
    expect(container.querySelector(".opacity-30")).not.toBeNull();
  });

  it("skips scroll tracking for an empty or single-entry timeline", () => {
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: true });
    const { rerender } = render(<Experience experiences={[]} />);
    rerender(<Experience experiences={mockExperiences.slice(0, 1)} />);
    expect(scrollHook).not.toHaveBeenCalled();
  });

  it("tracks only nearby lists and cleans up entry markers before remounting", () => {
    const originalObserver = globalThis.IntersectionObserver;
    const observers: {
      callback: IntersectionObserverCallback;
      options?: IntersectionObserverInit;
      target?: Element;
      disconnect: () => void;
    }[] = [];
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        record: (typeof observers)[number];
        constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
          this.record = { callback, options, disconnect: vi.fn() };
          observers.push(this.record);
        }
        observe(target: Element) {
          this.record.target = target;
        }
        unobserve() {}
        disconnect() {
          this.record.disconnect();
        }
      },
    );
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: true });
    const { container, unmount } = render(<Experience experiences={mockExperiences} />);
    try {
      const nearby = observers.find((observer) => observer.options?.rootMargin === "200px 0px")!;
      const emit = (visible: boolean) =>
        act(() =>
          nearby.callback(
            [{ target: nearby.target, isIntersecting: visible } as IntersectionObserverEntry],
            {} as IntersectionObserver,
          ),
        );
      expect(nearby.target).toBe(container.querySelector("ol")?.parentElement);
      expect(container.querySelector(".origin-top")).toBeNull();
      expect(container.querySelector("[data-timeline-track]")).not.toBeNull();
      expect(scrollHook).not.toHaveBeenCalled();
      emit(false);
      expect(scrollHook).not.toHaveBeenCalled();

      emit(true);
      expect(scrollHook).toHaveBeenCalledWith(expect.objectContaining({ trackContentSize: true }));
      const rail = container.querySelector(".origin-top");
      expect(rail).not.toBeNull();
      act(() => scrollProgress.current!.set(1));
      expect(container.querySelector("[data-timeline-filled]")).not.toBeNull();
      const highlighting = observers.find((observer) => observer.target?.matches("li"))!;
      act(() =>
        highlighting.callback(
          [{ target: highlighting.target, isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        ),
      );
      expect(container.querySelector("[data-timeline-active]")).not.toBeNull();

      emit(false);
      expect(container.querySelector(".origin-top")).toBeNull();
      expect(container.querySelector("[data-timeline-filled]")).toBeNull();
      expect(container.querySelector("[data-timeline-active]")).toBeNull();
      expect(highlighting.disconnect).toHaveBeenCalled();

      scrollHook.mockClear();
      emit(true);
      expect(scrollHook).toHaveBeenCalled();
      expect(container.querySelector(".origin-top")).not.toBe(rail);
      unmount();
      expect(nearby.disconnect).toHaveBeenCalled();
      scrollHook.mockClear();
      emit(true);
      expect(scrollHook).not.toHaveBeenCalled();
    } finally {
      unmount();
      vi.stubGlobal("IntersectionObserver", originalObserver);
    }
  });

  it("keeps scroll tracking available without IntersectionObserver", () => {
    const originalObserver = globalThis.IntersectionObserver;
    vi.stubGlobal("IntersectionObserver", undefined);
    const { container, unmount } = render(<Experience experiences={mockExperiences} />);
    try {
      expect(container.querySelector(".origin-top")).not.toBeNull();
      expect(scrollHook).toHaveBeenCalledWith(expect.objectContaining({ trackContentSize: true }));
    } finally {
      unmount();
      vi.stubGlobal("IntersectionObserver", originalObserver);
    }
  });

  it("remeasures filled dots when mobile details resize the nearby list", () => {
    const originalObserver = globalThis.ResizeObserver;
    let measure: ResizeObserverCallback | undefined;
    const disconnect = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(private callback: ResizeObserverCallback) {}
        observe(target: Element) {
          if (target.querySelector("[data-timeline-track]")) measure = this.callback;
        }
        disconnect = disconnect;
      },
    );
    let expanded = false;
    const trackHeight = vi
      .spyOn(HTMLElement.prototype, "offsetHeight", "get")
      .mockImplementation(function (this: HTMLElement) {
        return this.hasAttribute("data-timeline-track") ? (expanded ? 1400 : 1000) : 0;
      });
    const trackTop = vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockReturnValue(0);
    const bounds = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        const second = this.closest("li")?.dataset.experienceId === "2";
        return {
          top: second ? (expanded ? 900 : 400) : 0,
          height: this.hasAttribute("data-timeline-dot") ? 12 : 1400,
        } as DOMRect;
      });
    const { container, unmount } = render(<Experience experiences={mockExperiences} />);
    try {
      const secondDot = container.querySelectorAll("[data-timeline-dot]")[1];
      act(() => scrollProgress.current!.set(0.5));
      expect(secondDot).toHaveAttribute("data-timeline-filled");
      const details = screen.getAllByText("More details")[0].closest("details")!;
      fireEvent.click(screen.getAllByText("More details")[0]);
      expect(details.open).toBe(true);
      expanded = true;
      act(() => measure!([], {} as ResizeObserver));
      expect(secondDot).not.toHaveAttribute("data-timeline-filled");
      act(() => scrollProgress.current!.set(1));
      expect(secondDot).toHaveAttribute("data-timeline-filled");
      unmount();
      expect(disconnect).toHaveBeenCalled();
    } finally {
      unmount();
      bounds.mockRestore();
      trackTop.mockRestore();
      trackHeight.mockRestore();
      vi.stubGlobal("ResizeObserver", originalObserver);
    }
  });

  it("highlights the central entry on desktop and clears it when reduced motion is enabled", () => {
    const originalObserver = globalThis.IntersectionObserver;
    let notify: IntersectionObserverCallback;
    const observed: Element[] = [];
    const disconnect = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(
          private callback: IntersectionObserverCallback,
          private options?: IntersectionObserverInit,
        ) {}
        observe(target: Element) {
          if (this.options?.rootMargin === "200px 0px") {
            this.callback(
              [{ target, isIntersecting: true } as IntersectionObserverEntry],
              this as unknown as IntersectionObserver,
            );
          }
          if (target.matches("[data-experience-id]")) {
            observed.push(target);
            notify = this.callback;
          }
        }
        unobserve() {}
        disconnect = disconnect;
      },
    );
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: true });
    const { container, rerender, unmount } = render(<Experience experiences={mockExperiences} />);
    try {
      expect(observed).toHaveLength(2);
      act(() =>
        notify!(
          [{ target: observed[0], isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        ),
      );
      expect(observed[0]).toHaveAttribute("data-timeline-active", "true");
      act(() =>
        notify!(
          [
            { target: observed[0], isIntersecting: false } as IntersectionObserverEntry,
            { target: observed[1], isIntersecting: true } as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver,
        ),
      );
      expect(observed[0]).not.toHaveAttribute("data-timeline-active");
      expect(observed[1]).toHaveAttribute("data-timeline-active", "true");
      installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: true, [REDUCED_MOTION_QUERY]: true });
      rerender(<Experience experiences={[...mockExperiences]} />);
      expect(container.querySelector("[data-timeline-active]")).toBeNull();
      expect(disconnect).toHaveBeenCalled();
    } finally {
      unmount();
      vi.stubGlobal("IntersectionObserver", originalObserver);
    }
  });

  it("renders experience orgs", () => {
    render(<Experience experiences={mockExperiences} />);
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Beta Inc")).toBeInTheDocument();
  });

  it("renders experience periods", () => {
    render(<Experience experiences={mockExperiences} />);
    expect(screen.getByText("2022 – Present")).toBeInTheDocument();
    expect(screen.getByText("2020 – 2022")).toBeInTheDocument();
  });

  it("keeps full descriptions accessible behind the mobile disclosure", () => {
    render(<Experience experiences={mockExperiences} />);
    expect(screen.getByText("Built scalable APIs")).toBeInTheDocument();
    expect(screen.getByText("Led team of 5 engineers")).toBeInTheDocument();
    expect(screen.getByText("Led team of 5 engineers")).not.toBeVisible();
    fireEvent.click(screen.getAllByText("More details")[0]);
    expect(screen.getByText("Led team of 5 engineers")).toBeVisible();
  });

  it("renders the section with id='experience'", () => {
    const { container } = render(<Experience experiences={mockExperiences} />);
    expect(container.querySelector("#experience")).toBeTruthy();
  });

  it("renders static fallback when reduced motion is preferred", async () => {
    installMatchMedia({ [REDUCED_MOTION_QUERY]: true, [EXPRESSIVE_MOTION_QUERY]: true });

    const { container } = render(<Experience experiences={mockExperiences} />);
    expect(container.querySelector("ol")).toBeTruthy();
    expect(screen.getByText("Senior Software Engineer")).toBeInTheDocument();

    expect(scrollHook).not.toHaveBeenCalled();
  });

  it("renders empty state gracefully", () => {
    render(<Experience experiences={[]} />);
    expect(screen.getByText("Experience")).toBeInTheDocument();
  });

  it("renders location when provided", () => {
    render(<Experience experiences={mockExperiences} />);
    expect(screen.getByText("Remote")).toBeInTheDocument();
  });
});
