import { describe, it, expect, beforeEach, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { installMatchMedia } from "@/test/matchMedia";
import { ProjectsBrowser } from "./ProjectsBrowser";
import { Projects } from "./Projects";
import { EXPRESSIVE_MOTION_QUERY, REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import type { MergedProject } from "@/lib/projects";

beforeEach(() => installMatchMedia());

function project(id: number, over: Partial<MergedProject> = {}): MergedProject {
  return {
    id,
    repo: `repo-${id}`,
    title: `Project ${id}`,
    customBlurb: null,
    category: null,
    tags: [],
    featured: false,
    order: id,
    hidden: false,
    stars: 0,
    forks: 0,
    language: "TypeScript",
    description: `About ${id}`,
    homepage: null,
    htmlUrl: `https://github.com/aristache-labs/repo-${id}`,
    coverImage: null,
    screenshots: [],
    readmeExcerpt: null,
    pushedAt: null,
    ...over,
  };
}

describe("ProjectsBrowser categories and responsive limits", () => {
  const list = [
    project(1, { featured: true }),
    project(2, { featured: true }),
    ...Array.from({ length: 8 }, (_, i) =>
      project(i + 3, { pushedAt: new Date(2026, 9, 20 - i), category: "Web Apps" }),
    ),
    ...Array.from({ length: 12 }, (_, i) =>
      project(i + 11, { category: i < 8 ? "Websites" : "Desktop Apps" }),
    ),
  ];

  it("serves visible headings and project cards before hydration", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<Projects projects={list} />);
    expect(container.querySelector("h2")).toHaveTextContent("Selected Projects");
    expect(container.querySelectorAll("article")).toHaveLength(16);
    for (const element of container.querySelectorAll("h2, article h3")) {
      for (let node: Element | null = element; node; node = node.parentElement) {
        expect((node as HTMLElement).style.opacity).not.toBe("0");
      }
    }
  });

  it("keeps the grid entrance stable during rapid filtering and pagination", () => {
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: true });
    render(<ProjectsBrowser projects={list} />);
    const grid = screen.getByRole("heading", { name: "Project 11" }).closest("article")
      ?.parentElement?.parentElement;
    for (const name of [/^Desktop Apps/, /^Websites/, /^Desktop Apps/]) {
      fireEvent.click(screen.getByRole("button", { name }));
    }
    expect(
      screen.getByRole("heading", { name: "Project 19" }).closest("article")?.parentElement
        ?.parentElement,
    ).toBe(grid);
    expect(screen.queryByRole("heading", { name: "Project 11" })).not.toBeInTheDocument();
    expect(grid).not.toHaveStyle({ opacity: "0" });
    fireEvent.click(screen.getByRole("button", { name: /^Websites/ }));
    fireEvent.click(screen.getByRole("button", { name: "Show more projects" }));
    const added = screen.getByRole("heading", { name: "Project 18" }).closest("article");
    expect(added?.parentElement?.parentElement).toBe(grid);
    expect(added?.parentElement).not.toHaveStyle({ opacity: "0" });
  });

  it.each([1, 3, 11])(
    "opens Quick View from project %i and closes it without hiding its card",
    (id) => {
      const originalObserver = globalThis.ResizeObserver;
      vi.stubGlobal(
        "ResizeObserver",
        class {
          observe() {}
          disconnect() {}
        },
      );
      const { unmount } = render(<ProjectsBrowser projects={list} />);
      try {
        const card = screen.getByRole("heading", { name: `Project ${id}` }).closest("article")!;
        fireEvent.click(within(card).getByRole("button", { name: "View" }));
        expect(screen.getByRole("dialog", { name: `Project ${id}` })).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Close" }));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(card).toBeVisible();
      } finally {
        unmount();
        vi.stubGlobal("ResizeObserver", originalObserver);
      }
    },
  );

  it("keeps reduced-motion projects static and filters usable", () => {
    installMatchMedia({ [REDUCED_MOTION_QUERY]: true, [EXPRESSIVE_MOTION_QUERY]: true });
    const { container } = render(<ProjectsBrowser projects={list} />);
    expect(container.querySelector('[style*="opacity: 0"]')).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Desktop Apps/ }));
    expect(screen.getByRole("heading", { name: "Project 19" })).toBeVisible();
  });
  it("shows eight recent and six lower cards on desktop without duplicates", () => {
    render(<ProjectsBrowser projects={list} />);
    expect(screen.getAllByRole("article")).toHaveLength(16);
    expect(screen.queryByText("Show more recently updated")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Websites/ }));
    expect(screen.getAllByRole("article")).toHaveLength(16);
    fireEvent.click(screen.getByRole("button", { name: "Show more projects" }));
    expect(screen.getAllByRole("article")).toHaveLength(18);
    fireEvent.click(screen.getByRole("button", { name: /^Desktop Apps/ }));
    expect(screen.getAllByRole("article")).toHaveLength(14);
  });
  it("shows two lower cards in portrait and keeps undisplayed recent projects accessible", () => {
    installMatchMedia({ "(max-width: 1023px)": true });
    render(<ProjectsBrowser projects={list} />);
    expect(screen.getAllByRole("article")).toHaveLength(6);
    fireEvent.click(screen.getByRole("button", { name: /^Web Apps/ }));
    expect(screen.getByRole("heading", { name: "Project 5" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Project 7" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Project 10" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show more projects" }));
    expect(screen.getByRole("heading", { name: "Project 7" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show more projects" }));
    expect(screen.getByRole("heading", { name: "Project 10" })).toBeInTheDocument();
  });
  it("shows four lower cards in landscape and an empty state for an empty category", () => {
    installMatchMedia({ "(max-width: 1023px)": true, "(orientation: landscape)": true });
    render(<ProjectsBrowser projects={list} />);
    expect(screen.getAllByRole("article")).toHaveLength(8);
    fireEvent.click(screen.getByRole("button", { name: /^Automation & Tools/ }));
    expect(screen.getByText("No projects in Automation & Tools yet.")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(4);
  });
});
