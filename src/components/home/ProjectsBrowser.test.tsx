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

describe("ProjectsBrowser responsive limits", () => {
  const list = [
    project(1, { featured: true }),
    project(2, { featured: true }),
    ...Array.from({ length: 8 }, (_, i) => project(i + 3, { pushedAt: new Date(2026, 9, 20 - i) })),
    ...Array.from({ length: 8 }, (_, i) =>
      project(i + 11, { language: i === 7 ? "Dart" : "TypeScript" }),
    ),
  ];
  it("shows eight recent cards on desktop", () => {
    render(<ProjectsBrowser projects={list} />);
    const heading = screen.getByRole("heading", { name: "Recently updated" });
    expect(within(heading.parentElement as HTMLElement).getAllByRole("article")).toHaveLength(8);
    expect(screen.getAllByRole("article")).toHaveLength(14);
    expect(
      screen.queryByRole("button", { name: "Show more recently updated" }),
    ).not.toBeInTheDocument();
  });
  it("limits only mobile landscape to four recent cards", () => {
    installMatchMedia({
      "(orientation: landscape) and (max-width: 1023px) and (max-height: 500px) and (pointer: coarse)": true,
    });
    render(<ProjectsBrowser projects={list} />);
    expect(screen.getAllByRole("article")).toHaveLength(10);
    fireEvent.click(screen.getByRole("button", { name: "Show more recently updated" }));
    expect(screen.getAllByRole("article")).toHaveLength(14);
  });
  it("reveals lower cards independently and resets their filter limit", () => {
    render(<ProjectsBrowser projects={list} />);
    fireEvent.click(screen.getByRole("button", { name: "Show more projects" }));
    expect(screen.getAllByRole("article")).toHaveLength(18);
    fireEvent.click(screen.getByRole("button", { name: /^Dart/ }));
    expect(screen.getByRole("heading", { name: "Project 18" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^All/ }));
    expect(screen.getAllByRole("article")).toHaveLength(14);
  });
});
