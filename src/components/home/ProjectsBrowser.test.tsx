import { describe, it, expect, beforeEach, vi } from "vitest";
import { fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { installMatchMedia } from "@/test/matchMedia";
import { ProjectsBrowser } from "./ProjectsBrowser";
import { Projects } from "./Projects";
import { EXPRESSIVE_MOTION_QUERY, REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { PINNED_SCENE_QUERY } from "@/hooks/useMediaQuery";
import type { MergedProject } from "@/lib/projects";
import { MotionProvider } from "@/components/motion/MotionProvider";

beforeEach(() => installMatchMedia());

function project(id: number, over: Partial<MergedProject> = {}): MergedProject {
  return {
    id,
    repo: `repo-${id}`,
    title: `Project ${id}`,
    customBlurb: null,
    tagline: null,
    problem: null,
    solution: null,
    outcome: null,
    role: null,
    liveUrl: null,
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
    expect(container.querySelectorAll("article")).toHaveLength(14);
    for (const element of container.querySelectorAll("h2, h3, button")) {
      for (let node: Element | null = element; node; node = node.parentElement) {
        expect((node as HTMLElement).style.opacity).not.toBe("0");
      }
    }
  });

  it("keeps the grid entrance stable during rapid filtering and pagination", async () => {
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: true });
    render(
      <MotionProvider>
        <ProjectsBrowser projects={list} />
      </MotionProvider>,
    );
    const grid = screen.getByRole("heading", { name: "Project 11" }).closest(".grid");
    for (const name of [/^Desktop Apps/, /^Websites/, /^Desktop Apps/]) {
      fireEvent.click(screen.getByRole("button", { name }));
    }
    expect(screen.getByRole("heading", { name: "Project 19" }).closest(".grid")).toBe(grid);
    expect(screen.queryByRole("heading", { name: "Project 11" })).not.toBeInTheDocument();
    expect(grid).not.toHaveStyle({ opacity: "0" });
    fireEvent.click(screen.getByRole("button", { name: /^Websites/ }));
    fireEvent.click(screen.getByRole("button", { name: "Show more projects" }));
    const added = screen.getByRole("heading", { name: "Project 18" }).closest("article");
    expect(added?.closest(".grid")).toBe(grid);
    await waitFor(
      () =>
        expect(added?.closest("[data-project-grid-card]")).toHaveStyle({
          opacity: "1",
          transform: "none",
        }),
      { timeout: 1800 },
    );
  });

  it.each([
    ["desktop", true, false, false],
    ["mobile portrait", false, true, false],
    ["mobile landscape", false, true, true],
  ])(
    "animates category changes with fade and zoom on %s",
    async (_profile, desktop, mobile, landscape) => {
      installMatchMedia({
        [EXPRESSIVE_MOTION_QUERY]: desktop,
        "(max-width: 1023px)": mobile,
        "(orientation: landscape)": landscape,
      });
      render(
        <MotionProvider>
          <ProjectsBrowser projects={list} />
        </MotionProvider>,
      );
      fireEvent.click(screen.getByRole("button", { name: /^Websites/ }));
      const entrance = screen
        .getByRole("heading", { name: "Project 11" })
        .closest("[data-project-grid-card]")!;
      const grid = entrance.parentElement;
      expect(entrance).toHaveStyle({ opacity: "0", transform: "scale(0.9)" });
      await waitFor(() => expect(entrance).toHaveStyle({ opacity: "1", transform: "none" }), {
        timeout: 1800,
      });
      fireEvent.click(screen.getByRole("button", { name: /^Desktop Apps/ }));
      const next = screen
        .getByRole("heading", { name: "Project 19" })
        .closest("[data-project-grid-card]")!;
      expect(next.parentElement).toBe(grid);
      expect(next).toHaveStyle({ opacity: "0", transform: "scale(0.9)" });
    },
  );

  it.each([1, 3, 11])(
    "opens Quick View from project %i and closes it without hiding its card",
    async (id) => {
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
        fireEvent.click(within(card).getByRole("button", { name: /^View Project/ }));
        // The dialog module is lazy; its first import can outlast the 1s default when the whole
        // suite runs in parallel.
        expect(
          await screen.findByRole("dialog", { name: `Project ${id}` }, { timeout: 5000 }),
        ).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Close" }));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(card).toBeVisible();
        await waitFor(() =>
          expect(within(card).getByRole("button", { name: /^View Project/ })).toHaveFocus(),
        );
        fireEvent.click(within(card).getByRole("button", { name: /^View Project/ }));
        expect(await screen.findByRole("dialog", { name: `Project ${id}` })).toBeInTheDocument();
        fireEvent.keyDown(document.activeElement!, { key: "Escape" });
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        await waitFor(() =>
          expect(within(card).getByRole("button", { name: /^View Project/ })).toHaveFocus(),
        );
      } finally {
        unmount();
        vi.stubGlobal("ResizeObserver", originalObserver);
      }
    },
  );

  it("drives highlights and grid cards from scrolling on expressive desktops", () => {
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: true, [PINNED_SCENE_QUERY]: true });
    render(<ProjectsBrowser projects={list} />);
    const wrapper = (id: number) =>
      screen.getByRole("heading", { name: `Project ${id}` }).closest("[data-from]");
    expect(wrapper(1)).toHaveAttribute("data-from", "left");
    expect(wrapper(3)).toHaveAttribute("data-from", "right");
    expect(wrapper(11)).toHaveAttribute("data-from", "below");
  });

  it("keeps reduced-motion projects static and filters usable", () => {
    installMatchMedia({ [REDUCED_MOTION_QUERY]: true, [EXPRESSIVE_MOTION_QUERY]: true });
    const { container } = render(<ProjectsBrowser projects={list} />);
    expect(container.querySelector('[style*="opacity: 0"]')).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Desktop Apps/ }));
    expect(screen.getByRole("heading", { name: "Project 19" })).toBeVisible();
  });

  it("loads the gallery on demand and starts at the poster when reopened", async () => {
    const originalObserver = globalThis.ResizeObserver;
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    const { unmount } = render(
      <ProjectsBrowser
        projects={[
          project(1, { featured: true, coverImage: "/poster.webp", screenshots: ["/detail.webp"] }),
        ]}
      />,
    );
    try {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      const open = screen.getByRole("button", { name: /^View Project/ });
      fireEvent.click(open);
      const dialog = await screen.findByRole("dialog", { name: "Project 1" });
      expect(within(dialog).getByAltText("Project 1 poster")).toBeInTheDocument();
      fireEvent.click(within(dialog).getByRole("button", { name: "Next image" }));
      expect(within(dialog).getByAltText("Project 1 screenshot 1")).toBeInTheDocument();
      fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
      fireEvent.click(open);
      const reopened = await screen.findByRole("dialog", { name: "Project 1" });
      expect(within(reopened).getByAltText("Project 1 poster")).toBeInTheDocument();
    } finally {
      unmount();
      vi.stubGlobal("ResizeObserver", originalObserver);
    }
  });
  it("shows six recent and six lower cards on desktop without duplicates", () => {
    render(<ProjectsBrowser projects={list} />);
    expect(screen.getAllByRole("article")).toHaveLength(14);
    expect(screen.queryByText("Show more Latest work")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Websites/ }));
    expect(screen.getAllByRole("article")).toHaveLength(14);
    fireEvent.click(screen.getByRole("button", { name: "Show more projects" }));
    expect(screen.getAllByRole("article")).toHaveLength(16);
    fireEvent.click(screen.getByRole("button", { name: /^Desktop Apps/ }));
    expect(screen.getAllByRole("article")).toHaveLength(12);
  });

  it.each([
    ["one category", [project(1, { category: "Websites" }), project(2, { category: "Websites" })]],
    [
      "three projects",
      [
        project(1, { category: "Websites" }),
        project(2, { category: "Desktop Apps" }),
        project(3, { category: "Websites" }),
      ],
    ],
  ])("hides filters that would not help with %s", (_case, few) => {
    installMatchMedia({ "(max-width: 1023px)": true });
    render(<ProjectsBrowser projects={[...few, ...list.slice(2, 4)]} />);
    expect(screen.getByText("More projects")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^All/ })).not.toBeInTheDocument();
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
  it("shows three recent and four lower cards in landscape and omits empty categories", () => {
    installMatchMedia({ "(max-width: 1023px)": true, "(orientation: landscape)": true });
    render(<ProjectsBrowser projects={list} />);
    expect(screen.getAllByRole("article")).toHaveLength(9);
    const recentHeading = screen.getByText("Latest work");
    const recentColumn = recentHeading.parentElement!.parentElement!;
    expect(within(recentColumn).getAllByRole("article")).toHaveLength(3);
    expect(screen.queryByRole("button", { name: /^Automation & Tools/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^All/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("More projects").tagName).toBe("P");
    expect(screen.getByText("Latest work").tagName).toBe("P");
    expect(screen.getByText("Featured", { exact: true, selector: "p" }).tagName).toBe("P");
  });

  it("resets an emptied category and pagination when data changes", () => {
    const { rerender } = render(<ProjectsBrowser projects={list} />);
    fireEvent.click(screen.getByRole("button", { name: /^Websites/ }));
    fireEvent.click(screen.getByRole("button", { name: "Show more projects" }));
    rerender(
      <ProjectsBrowser
        projects={list.map((p) =>
          p.category === "Websites" ? { ...p, category: "Desktop Apps" } : p,
        )}
      />,
    );
    expect(screen.queryByRole("button", { name: /^Websites/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^All/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("article")).toHaveLength(14);
    expect(screen.getByRole("button", { name: "Show more projects" })).toBeInTheDocument();
  });

  it("resets an emptied category after the viewport moves its projects into recent", () => {
    // Six Web Apps: two recent on mobile, all six recent on desktop.
    const sixWebApps = list.filter((p) => p.id !== 9 && p.id !== 10);
    installMatchMedia({ "(max-width: 1023px)": true });
    const { rerender } = render(<ProjectsBrowser projects={sixWebApps} />);
    fireEvent.click(screen.getByRole("button", { name: /^Web Apps/ }));
    fireEvent.click(screen.getByRole("button", { name: "Show more projects" }));
    installMatchMedia();
    rerender(<ProjectsBrowser projects={[...sixWebApps]} />);
    expect(screen.queryByRole("button", { name: /^Web Apps/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^All/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("article")).toHaveLength(14);
  });

  it("restores focus to Projects when the opener disappears while the gallery is open", async () => {
    const originalObserver = globalThis.ResizeObserver;
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    const { container, rerender, unmount } = render(<ProjectsBrowser projects={list} />);
    try {
      fireEvent.click(screen.getByRole("button", { name: "View Project 1" }));
      await screen.findByRole("dialog", { name: "Project 1" });
      rerender(<ProjectsBrowser projects={list.filter((p) => p.id !== 1)} />);
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      await waitFor(() => expect(container.querySelector('[aria-label="Projects"]')).toHaveFocus());
    } finally {
      unmount();
      vi.stubGlobal("ResizeObserver", originalObserver);
    }
  });

  it("names project actions in all three card layouts", () => {
    render(
      <ProjectsBrowser projects={list.map((p) => ({ ...p, homepage: "https://example.com" }))} />,
    );
    for (const id of [1, 3, 11]) {
      expect(screen.getByRole("button", { name: "View Project " + id })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Code for Project " + id })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Live site for Project " + id })).toBeInTheDocument();
    }
  });
});
