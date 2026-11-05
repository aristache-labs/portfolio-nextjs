import type { MergedProject } from "@/lib/projects";

export function fixture(id: number, overrides: Partial<MergedProject> = {}): MergedProject {
  return {
    id,
    group: null,
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
    coverImage: null,
    screenshots: [],
    stars: id,
    forks: 0,
    language: null,
    description: "Full description",
    homepage: null,
    htmlUrl: null,
    readmeExcerpt: null,
    pushedAt: null,
    ...overrides,
  };
}
