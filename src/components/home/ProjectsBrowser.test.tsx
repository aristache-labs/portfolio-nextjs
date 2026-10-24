import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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
