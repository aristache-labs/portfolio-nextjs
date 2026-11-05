import { act } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { EXPRESSIVE_MOTION_QUERY, REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { PINNED_SCENE_QUERY } from "@/hooks/useMediaQuery";
import type { MergedProject } from "@/lib/projects";
import { Projects } from "./Projects";
import { ProjectsGridCard } from "./ProjectsGrid";
import { PROJECTS_LANDSCAPE_QUERY, PROJECTS_PORTRAIT_QUERY } from "./ProjectsArrival";

const projects: MergedProject[] = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  repo: `repo-${i}`,
  title: `Project ${i}`,
  customBlurb: null,
  tagline: null,
  problem: null,
  solution: null,
  outcome: null,
  role: null,
  liveUrl: null,
  category: "Web Apps",
  tags: [],
  featured: i < 2,
  order: i,
  hidden: false,
  stars: 0,
  forks: 0,
  language: null,
  description: "Description",
  homepage: null,
  htmlUrl: null,
  coverImage: null,
  screenshots: [],
  readmeExcerpt: null,
  pushedAt: new Date(2026, 9, 30 - i),
}));

function mediaQueries() {
  const matches = new Map<string, boolean>(),
    listeners = new Map<string, Set<() => void>>();
  vi.stubGlobal("matchMedia", (query: string) => ({
    get matches() {
      return matches.get(query) ?? false;
    },
    media: query,
    addEventListener: (_: string, cb: () => void) => {
      if (!listeners.has(query)) listeners.set(query, new Set());
      listeners.get(query)!.add(cb);
    },
    removeEventListener: (_: string, cb: () => void) => listeners.get(query)?.delete(cb),
  }));
  return (profile: "portrait" | "landscape" | "desktop", reduced = false) => {
    matches.set(PROJECTS_PORTRAIT_QUERY, profile === "portrait");
    matches.set(PROJECTS_LANDSCAPE_QUERY, profile === "landscape");
    matches.set("(max-width: 1023px)", profile !== "desktop");
    matches.set("(orientation: landscape)", profile !== "portrait");
    matches.set(PINNED_SCENE_QUERY, profile === "desktop");
    matches.set(EXPRESSIVE_MOTION_QUERY, profile === "desktop");
    matches.set(REDUCED_MOTION_QUERY, reduced);
    for (const group of listeners.values()) for (const cb of group) cb();
  };
}

describe("Projects responsive identity", () => {
  let root: Root | undefined, container: HTMLDivElement;
  afterEach(async () => {
    await act(async () => root?.unmount());
    root = undefined;
    container?.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
  function nodes() {
    return [
      container.querySelector("h2"),
      ...[...container.querySelectorAll("article")].slice(0, 4),
      container.querySelector("[data-projects-grid]"),
    ];
  }
  function same(before: ReturnType<typeof nodes>) {
    const current = nodes();
    expect(current).toHaveLength(before.length);
    current.forEach((n, i) => expect(n).toBe(before[i]));
  }
  async function mount(profile: "portrait" | "landscape" | "desktop") {
    const setProfile = mediaQueries();
    setProfile(profile);
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    const content = (
      <MotionProvider>
        <Projects projects={projects} />
      </MotionProvider>
    );
    container = document.createElement("div");
    container.innerHTML = renderToString(content);
    document.body.append(container);
    const before = nodes(),
      recoverable = vi.fn();
    await act(async () => {
      root = hydrateRoot(container, content, { onRecoverableError: recoverable });
    });
    expect(recoverable).not.toHaveBeenCalled();
    same(before);
    return { setProfile, before };
  }
  it.each(["portrait", "landscape", "desktop"] as const)(
    "retains the SSR heading, shared highlights and grid after %s hydration",
    async (profile) => {
      await mount(profile);
    },
  );
  it("retains shared content through rotation, desktop and reduced motion", async () => {
    const { setProfile, before } = await mount("portrait");
    for (const profile of ["landscape", "desktop", "portrait"] as const) {
      await act(async () => setProfile(profile));
      same(before);
    }
    await act(async () => setProfile("portrait", true));
    same(before);
    expect(container.querySelector("[data-project-reveal=armed]")).toBeNull();
  });
  it("keeps the grid card mounted when mobile, scroll and timed drivers change", async () => {
    const setProfile = mediaQueries();
    setProfile("desktop");
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    const content = (mobile: boolean, scene: boolean) => (
      <MotionProvider>
        <ProjectsGridCard
          mobile={mobile}
          scene={scene}
          interacted={false}
          staticMotion={false}
          order={0}
          variants={{}}
        >
          <article>Card</article>
        </ProjectsGridCard>
      </MotionProvider>
    );
    container = document.createElement("div");
    container.innerHTML = renderToString(content(false, false));
    document.body.append(container);
    const card = container.querySelector("article");
    await act(async () => {
      root = hydrateRoot(container, content(false, false));
    });
    for (const [mobile, scene] of [
      [true, false],
      [false, true],
      [false, false],
    ]) {
      await act(async () => {
        setProfile(mobile ? "portrait" : "desktop");
        root!.render(content(mobile, scene));
      });
      expect(container.querySelector("article")).toBe(card);
    }
  });
});
