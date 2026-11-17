import { describe, it, expect, beforeEach, vi } from "vitest";
import { fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { installMatchMedia } from "@/test/matchMedia";
import { ProjectsBrowser } from "./ProjectsBrowser";
import { Projects } from "./Projects";
import { EXPRESSIVE_MOTION_QUERY, REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { PINNED_SCENE_QUERY } from "@/hooks/useMediaQuery";
import type { MergedProject } from "@/lib/projects";

beforeEach(() => installMatchMedia());

function project(id: number, over: Partial<MergedProject> = {}): MergedProject {
  return {
    group: null,
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

const list = [
  project(1, { featured: true }),
  project(2, { featured: true }),
  ...Array.from({ length: 8 }, (_, i) => project(i + 3, { pushedAt: new Date(2026, 9, 20 - i) })),
  ...Array.from({ length: 12 }, (_, i) => project(i + 11)),
];

function stubResizeObserver() {
  const original = globalThis.ResizeObserver;
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  return () => vi.stubGlobal("ResizeObserver", original);
}

describe("ProjectsBrowser highlights", () => {
  it("renders one card per group and exposes every component repository", () => {
    const grouped = [
      project(1, { group: "gym", title: "Gym App", featured: true }),
      project(2, { group: "gym", title: "Gym Scanner" }),
      project(3, { group: "gym", title: "Gym Panel" }),
    ];
    render(<ProjectsBrowser projects={grouped} />);
    expect(screen.getAllByRole("article")).toHaveLength(1);
    for (const member of grouped) {
      expect(screen.getByRole("link", { name: member.title })).toHaveAttribute(
        "href",
        member.htmlUrl,
      );
    }
  });

  it("shows the newest GitHub push as Building now even for a live project", () => {
    render(
      <ProjectsBrowser
        projects={[
          project(1, {
            title: "portofolio-nextjs",
            repo: "portofolio-nextjs",
            homepage: "https://x.example",
            pushedAt: new Date("2026-11-04"),
          }),
          project(2, { title: "Old Draft", pushedAt: new Date("2026-09-10") }),
          project(3, { title: "Laneroy", pushedAt: new Date("2026-10-28") }),
        ]}
      />,
    );
    const strip = screen.getByText("Building now").closest("div") as HTMLElement;
    expect(within(strip).getByText("portofolio-nextjs")).toBeInTheDocument();
    expect(within(strip).getByText("Nov 4")).toBeInTheDocument();
  });

  it("omits Building now when no project has a push date", () => {
    render(<ProjectsBrowser projects={[project(1), project(2)]} />);
    expect(screen.queryByText("Building now")).not.toBeInTheDocument();
  });

  it("serves visible headings and cards before hydration, without a More projects section", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<Projects projects={list} />);
    expect(container.querySelector("h2")).toHaveTextContent("Selected Projects");
    expect(container.querySelectorAll("article")).toHaveLength(6);
    expect(container.textContent).not.toContain("More projects");
    expect(container.textContent).toContain("View all on GitHub");
    for (const element of container.querySelectorAll("h2, h3, button")) {
      for (let node: Element | null = element; node; node = node.parentElement) {
        expect((node as HTMLElement).style.opacity).not.toBe("0");
      }
    }
  });

  it("shows featured by admin order and recent strictly by push date, with no duplicates", () => {
    render(<ProjectsBrowser projects={list} />);
    const titles = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(titles).toEqual([
      "Project 1",
      "Project 2",
      "Project 3",
      "Project 4",
      "Project 5",
      "Project 6",
    ]);
    expect(screen.getByText("Recently updated")).toBeInTheDocument();
    expect(screen.queryByText("Latest work")).not.toBeInTheDocument();
  });

  it.each([
    ["a single column below 640px", { "(max-width: 639px)": true }, 3],
    ["two columns from 640px", {}, 4],
  ] as const)("shows Recently updated in %s", (_name, queries, recentCount) => {
    installMatchMedia(queries);
    render(<ProjectsBrowser projects={list} />);
    const column = screen.getByText("Recently updated").parentElement!.parentElement!;
    expect(within(column).getAllByRole("article")).toHaveLength(recentCount);
  });

  it.each([
    ["no featured", 0],
    ["one featured", 1],
    ["three featured", 3],
  ])("renders %s with long titles and missing covers", (_name, count) => {
    const long = "A very long project title that keeps going past any reasonable card width";
    render(
      <ProjectsBrowser
        projects={Array.from({ length: count + 2 }, (_, i) =>
          project(i + 1, {
            title: `${long} ${i + 1}`,
            featured: i < count,
            pushedAt: new Date(2026, 9, 20 - i),
          }),
        )}
      />,
    );
    expect(screen.getAllByRole("article")).toHaveLength(count + 2);
    expect(screen.getAllByRole("heading", { level: 3 })[0]).toHaveTextContent("A very long");
  });

  it.each([1, 3])("opens Quick View from project %i and restores focus on close", async (id) => {
    const restore = stubResizeObserver();
    const { unmount } = render(<ProjectsBrowser projects={list} />);
    try {
      const card = screen.getByRole("heading", { name: `Project ${id}` }).closest("article")!;
      fireEvent.click(within(card).getByRole("button", { name: /^View Project/ }));
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
      restore();
    }
  });

  it("drives highlight cards from scrolling on expressive desktops", () => {
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: true, [PINNED_SCENE_QUERY]: true });
    render(<ProjectsBrowser projects={list} />);
    const wrapper = (id: number) =>
      screen.getByRole("heading", { name: `Project ${id}` }).closest("[data-from]");
    expect(wrapper(1)).toHaveAttribute("data-from", "left");
    expect(wrapper(3)).toHaveAttribute("data-from", "right");
  });

  it.each([false, true])(
    "shares the iPad landscape scroll scene on touch, with reduced motion %s",
    (reduce) => {
      installMatchMedia({
        [REDUCED_MOTION_QUERY]: reduce,
        "(min-width: 1181px) and (max-width: 1300px) and (min-height: 700px) and (orientation: landscape) and (pointer: coarse), (min-width: 1340px) and (max-width: 1390px) and (min-height: 900px) and (max-height: 1050px) and (orientation: landscape)": true,
      });
      const { container } = render(<ProjectsBrowser projects={list} />);
      expect(Boolean(container.querySelector('[data-from="left"]'))).toBe(!reduce);
      expect(Boolean(container.querySelector('[data-from="right"]'))).toBe(!reduce);
    },
  );

  it("keeps reduced-motion projects static", () => {
    installMatchMedia({ [REDUCED_MOTION_QUERY]: true, [EXPRESSIVE_MOTION_QUERY]: true });
    const { container } = render(<ProjectsBrowser projects={list} />);
    expect(container.querySelector('[style*="opacity: 0"]')).toBeNull();
  });

  it("loads the gallery on demand and starts at the poster when reopened", async () => {
    const restore = stubResizeObserver();
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
      restore();
    }
  });

  it("restores focus to Projects when the opener disappears while the gallery is open", async () => {
    const restore = stubResizeObserver();
    const { container, rerender, unmount } = render(<ProjectsBrowser projects={list} />);
    try {
      fireEvent.click(screen.getByRole("button", { name: "View Project 1" }));
      await screen.findByRole("dialog", { name: "Project 1" });
      rerender(<ProjectsBrowser projects={list.filter((p) => p.id !== 1)} />);
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      await waitFor(() => expect(container.querySelector('[aria-label="Projects"]')).toHaveFocus());
    } finally {
      unmount();
      restore();
    }
  });

  it("names project actions in every card layout", () => {
    render(
      <ProjectsBrowser projects={list.map((p) => ({ ...p, homepage: "https://example.com" }))} />,
    );
    for (const id of [1, 2, 3]) {
      expect(screen.getByRole("button", { name: "View Project " + id })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Code for Project " + id })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Live site for Project " + id })).toHaveAttribute(
        "href",
        "https://example.com",
      );
    }
    const repo = list[2].htmlUrl;
    expect(screen.getByRole("link", { name: "Issues for Project 3" })).toHaveAttribute(
      "href",
      `${repo}/issues`,
    );
    // The pull requests icon sits in the repo header, so it names the repository, not the title.
    expect(
      screen.getByRole("link", { name: `Pull requests for ${list[2].repo} on GitHub` }),
    ).toHaveAttribute("href", `${repo}/pulls`);
    const recent = screen.getByRole("heading", { name: "Project 3" }).closest("article")!;
    expect(within(recent).getByText(/^Updated /)).toHaveAttribute(
      "datetime",
      list[2].pushedAt?.toISOString(),
    );
  });

  it("shows assigned categories and leaves uncategorized projects without a badge", () => {
    const pushedAt = new Date("2026-10-28T12:00:00Z");
    render(
      <ProjectsBrowser
        projects={[
          project(1, { pushedAt, category: "Automation & Tools" }),
          project(2, { pushedAt }),
        ]}
      />,
    );

    expect(screen.getByTitle("Automation & Tools")).toHaveTextContent("Automation & Tools");
    const uncategorized = screen.getByRole("heading", { name: "Project 2" }).closest("article");
    expect(uncategorized?.querySelector("[data-category]")).toBeNull();
  });
});
