import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
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

/** Grid cards only, in reading order. Highlight columns are excluded. */
function gridTitles(): string[] {
  const skip = new Set([...titlesIn("Featured"), ...titlesIn("Recently updated")]);
  return screen
    .getAllByRole("article")
    .map((card) => within(card).getByRole("heading", { level: 3 }).textContent ?? "")
    .filter((title) => !skip.has(title));
}

describe("ProjectsBrowser highlights", () => {
  it("shows at most two featured projects on the left", () => {
    const list = [1, 2, 3, 4].map((id) => project(id, { featured: true }));
    render(<ProjectsBrowser projects={list} />);
    expect(titlesIn("Featured")).toEqual(["Project 1", "Project 2"]);
  });

  it("shows at most five recently pushed projects without repeating the featured column", () => {
    const list = [
      project(1, { featured: true, pushedAt: day(14) }),
      project(2, { pushedAt: day(1) }),
      project(3, { pushedAt: day(10) }),
      project(4, { pushedAt: day(5) }),
      project(5, { pushedAt: day(7) }),
      project(6, { pushedAt: day(9) }),
      project(7, { pushedAt: day(2) }),
    ];
    render(<ProjectsBrowser projects={list} />);
    // The featured project is the newest push overall but must not repeat here.
    expect(titlesIn("Recently updated")).toEqual([
      "Project 3",
      "Project 6",
      "Project 5",
      "Project 4",
      "Project 7",
    ]);
  });

  it("ranks a project with no push date last", () => {
    const list = [
      project(1),
      project(2, { pushedAt: day(2) }),
      project(3, { pushedAt: day(3) }),
      project(4, { pushedAt: day(1) }),
    ];
    render(<ProjectsBrowser projects={list} />);
    expect(titlesIn("Recently updated")).toEqual([
      "Project 3",
      "Project 2",
      "Project 4",
      "Project 1",
    ]);
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
      project(8, { pushedAt: day(6), language: "Python" }),
      project(9, { pushedAt: day(5), language: "Dart" }),
    ];
    render(<ProjectsBrowser projects={list} />);
    // Featured: 1 and 2. Recent: 3, 4, 5, 8 and 9. Grid: 6 and 7, so "All" is 2.
    expect(screen.getByRole("button", { name: /^All\s?2$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Python\s?1$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Dart\s?1$/ })).toBeInTheDocument();
    expect(gridTitles()).toEqual(["Project 6", "Project 7"]);
  });

  it("shows nine grid projects per page and returns to the first page on a new category", () => {
    const list = [
      project(1, { featured: true }),
      project(2, { featured: true }),
      project(3, { pushedAt: day(9) }),
      project(4, { pushedAt: day(8) }),
      project(5, { pushedAt: day(7) }),
      project(6, { pushedAt: day(6) }),
      project(7, { pushedAt: day(5) }),
      ...Array.from({ length: 10 }, (_, i) => project(8 + i)),
      project(18, { language: "Dart" }),
    ];
    render(<ProjectsBrowser projects={list} />);

    expect(screen.getByRole("heading", { name: "Project 8" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Project 17" })).not.toBeInTheDocument();
    expect(gridTitles()).toHaveLength(9);

    fireEvent.click(screen.getByRole("button", { name: "Page 2" }));
    expect(screen.getByRole("heading", { name: "Project 17" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Project 18" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Project 8" })).not.toBeInTheDocument();
    expect(gridTitles()).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: /^Dart/ }));
    expect(screen.getByRole("heading", { name: "Project 18" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Page 2" })).not.toBeInTheDocument();
  });

  it("leads the grid with featured projects, left to right", () => {
    const list = [
      project(1, { featured: true }),
      project(2, { featured: true }),
      project(3, { pushedAt: day(9) }),
      project(4, { pushedAt: day(8) }),
      project(5, { pushedAt: day(7) }),
      project(6),
      project(7, { featured: true }),
      project(8, { pushedAt: day(6) }),
      project(9, { pushedAt: day(5) }),
    ];
    render(<ProjectsBrowser projects={list} />);

    expect(gridTitles()).toEqual(["Project 7", "Project 6"]);
    const featuredCard = screen.getByRole("heading", { name: "Project 7" }).closest("article");
    expect(within(featuredCard as HTMLElement).getByText("Featured")).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("heading", { name: "Project 6" }).closest("article") as HTMLElement,
      ).queryByText("Featured"),
    ).not.toBeInTheDocument();
  });
});
