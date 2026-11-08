import type { MergedProject } from "./projects";

export type ProjectPresentation = MergedProject & { components: MergedProject[]; hasLive: boolean };

export function cardDescription(project: MergedProject): string {
  const tagline = project.tagline?.trim();
  if (tagline) return tagline;
  const text = project.description?.trim().replace(/\s+/g, " ") || "";
  if (text.length <= 140) return text;
  const prefix = text.slice(0, 137);
  const boundary = prefix.lastIndexOf(" ");
  return `${prefix.slice(0, boundary > 0 ? boundary : 137).trimEnd()}...`;
}

export function liveFirst(a: ProjectPresentation, b: ProjectPresentation) {
  return Number(b.hasLive) - Number(a.hasLive);
}

export function groupProjects(projects: MergedProject[]): ProjectPresentation[] {
  const groups = new Map<string, MergedProject[]>();
  for (const project of projects) {
    if (project.hidden) continue;
    const key = project.group?.trim().toLowerCase();
    const identity = key ? `group:${key}` : `project:${project.id}`;
    const members = groups.get(identity) ?? [];
    members.push(project);
    groups.set(identity, members);
  }
  return [...groups.values()]
    .map((members) => {
      const components = [...members].sort((a, b) => a.order - b.order || a.id - b.id);
      const dates = components.flatMap((p) => (p.pushedAt ? [p.pushedAt.getTime()] : []));
      return {
        ...components[0],
        components,
        featured: components.some((p) => p.featured),
        hasLive: components.some((p) => Boolean(p.homepage)),
        pushedAt: dates.length ? new Date(Math.max(...dates)) : null,
      };
    })
    .sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        liveFirst(a, b) ||
        a.order - b.order ||
        a.id - b.id,
    );
}

/**
 * The project with the newest GitHub push, for the "Building now" strip, regardless of
 * whether it has a live site. Returns null when no project has a push date.
 */
export function currentlyBuilding(projects: ProjectPresentation[]): ProjectPresentation | null {
  const dated = projects.filter((project) => project.pushedAt);
  return (
    [...dated].sort((a, b) => b.pushedAt!.getTime() - a.pushedAt!.getTime() || a.id - b.id)[0] ??
    null
  );
}

/** "Nov 4", fixed to UTC so the server and the browser print the same day. */
export function pushedLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}
