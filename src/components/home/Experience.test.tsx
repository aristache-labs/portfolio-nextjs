import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Experience } from "./Experience";
import type { ExperienceRow } from "@/lib/queries";
import { installMatchMedia } from "@/test/matchMedia";
import { EXPRESSIVE_MOTION_QUERY, REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { renderToString } from "react-dom/server";

const scrollHook = vi.hoisted(() => vi.fn());
vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return {
    ...actual,
    useScroll: (options: unknown) => {
      scrollHook(options);
      return { scrollYProgress: actual.useMotionValue(0) };
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

  it("highlights the central entry on desktop and clears it when reduced motion is enabled", () => {
    const originalObserver = globalThis.IntersectionObserver;
    let notify: IntersectionObserverCallback;
    const observed: Element[] = [];
    const disconnect = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(private callback: IntersectionObserverCallback) {}
        observe(target: Element) {
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
