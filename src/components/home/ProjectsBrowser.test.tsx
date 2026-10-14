import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { installMatchMedia } from "@/test/matchMedia";
import { ProjectsBrowser } from "./ProjectsBrowser";
import type { MergedProject } from "@/lib/projects";

vi.mock("@/components/ui/Meteors", () => ({ Meteors: () => null }));

beforeEach(() => installMatchMedia());

function project(id: number, over: Partial<MergedProject> = {}): MergedProject {
  return {
    id,
    repo: `repo-${id}`,
    title: `Project ${id}`,
    customBlurb: null,
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

const day = (d: number) => new Date(Date.UTC(2026, 9, d));

function column(name: string) {
  const heading = screen.getByRole("heading", { name });
  return within(heading.parentElement as HTMLElement);
}

/** Card titles in a column, in render order. The column label is not a card, so it is skipped. */
function titlesIn(name: string): string[] {
  return column(name)
    .getAllByRole("article")
    .map((card) => within(card).getByRole("heading", { level: 3 }).textContent ?? "");
}

describe("ProjectsBrowser highlights", () => {
  it("shows at most two featured projects on the left", () => {
    const list = [1, 2, 3, 4].map((id) => project(id, { featured: true }));
    render(<ProjectsBrowser projects={list} />);
    expect(titlesIn("Featured")).toEqual(["Project 1", "Project 2"]);
  });

  it("shows the three most recently pushed non-featured projects on the right", () => {
    const list = [
      project(1, { featured: true, pushedAt: day(14) }),
      project(2, { pushedAt: day(1) }),
      project(3, { pushedAt: day(10) }),
      project(4, { pushedAt: day(5) }),
      project(5, { pushedAt: day(7) }),
    ];
    render(<ProjectsBrowser projects={list} />);
    // The featured project is the newest push overall but must not repeat here.
    expect(titlesIn("Recently updated")).toEqual(["Project 3", "Project 5", "Project 4"]);
  });

  it("ranks a project with no push date last", () => {
    const list = [
      project(1),
      project(2, { pushedAt: day(2) }),
      project(3, { pushedAt: day(3) }),
      project(4, { pushedAt: day(1) }),
    ];
    render(<ProjectsBrowser projects={list} />);
    expect(titlesIn("Recently updated")).toEqual(["Project 3", "Project 2", "Project 4"]);
  });

  it("leaves the remaining projects to the grid and counts chips over the grid only", () => {
    const list = [
      project(1, { featured: true }),
      project(2, { featured: true }),
      project(3, { pushedAt: day(9), language: "Python" }),
      project(4, { pushedAt: day(8), language: "Dart" }),
      project(5, { pushedAt: day(7), language: "Python" }),
      project(6, { pushedAt: day(1), language: "Python" }),
      project(7, { pushedAt: day(2), language: "Dart" }),
    ];
    render(<ProjectsBrowser projects={list} />);
    // Featured: 1 and 2. Recent: 3, 4 and 5. Grid: 6 and 7, so "All" is 2.
    expect(screen.getByRole("button", { name: /^All\s?2$/ })).toBeInTheDocument();
  });
});
