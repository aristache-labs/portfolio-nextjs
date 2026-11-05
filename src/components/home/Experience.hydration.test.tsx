import { act } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { EXPRESSIVE_MOTION_QUERY, REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { Experience } from "./Experience";
import { EXPERIENCE_LANDSCAPE_QUERY, EXPERIENCE_PORTRAIT_QUERY } from "./ExperienceMobileReveal";

const experiences = [1, 2].map((id) => ({
  id,
  role: `Engineer ${id}`,
  org: `Company ${id}`,
  period: "2024 - 2026",
  location: "Remote",
  isCurrent: id === 1,
  volunteer: false,
  description: ["First task", "Second task", "Third task", "Fourth task"],
  order: id,
}));

function mediaQueries() {
  const matches = new Map<string, boolean>();
  const listeners = new Map<string, Set<() => void>>();
  vi.stubGlobal("matchMedia", (query: string) => ({
    get matches() {
      return matches.get(query) ?? false;
    },
    media: query,
    addEventListener: (_: string, listener: () => void) => {
      if (!listeners.has(query)) listeners.set(query, new Set());
      listeners.get(query)!.add(listener);
    },
    removeEventListener: (_: string, listener: () => void) =>
      listeners.get(query)?.delete(listener),
  }));
  return (profile: "portrait" | "landscape" | "desktop", reduced = false) => {
    matches.set(EXPERIENCE_PORTRAIT_QUERY, profile === "portrait");
    matches.set(EXPERIENCE_LANDSCAPE_QUERY, profile === "landscape");
    matches.set("(min-width: 1024px)", profile === "desktop");
    matches.set("(min-width: 1024px) and (pointer: fine)", profile === "desktop");
    matches.set(EXPRESSIVE_MOTION_QUERY, profile === "desktop");
    matches.set(REDUCED_MOTION_QUERY, reduced);
    for (const group of listeners.values()) for (const listener of group) listener();
  };
}

describe("Experience content identity", () => {
  let root: Root | undefined;
  let container: HTMLDivElement;

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
      ...container.querySelectorAll("[data-experience-id] h3, [data-experience-id] details"),
      ...Array.from(container.querySelectorAll("a")).filter(
        (n) => !n.closest("[data-current-role]"),
      ),
    ];
  }

  function sameNodes(before: ReturnType<typeof nodes>) {
    const current = nodes();
    expect(current).toHaveLength(before.length);
    current.forEach((node, index) => expect(node).toBe(before[index]));
  }

  async function mount(profile: "portrait" | "landscape" | "desktop", reduced = false) {
    const setProfile = mediaQueries();
    setProfile(profile, reduced);
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
        <Experience experiences={experiences} resumeUrl="https://example.com/cv.pdf" />
      </MotionProvider>
    );
    container = document.createElement("div");
    container.innerHTML = renderToString(content);
    document.body.append(container);
    const before = nodes();
    const recoverable = vi.fn();
    await act(async () => {
      root = hydrateRoot(container, content, { onRecoverableError: recoverable });
    });
    expect(recoverable).not.toHaveBeenCalled();
    sameNodes(before);
    return { setProfile, before };
  }

  it.each(["portrait", "landscape", "desktop"] as const)(
    "retains the server-rendered heading, roles, disclosures and CV after %s hydration",
    async (profile) => {
      await mount(profile);
    },
  );

  it("retains content and independent disclosure state through rotation and reduced motion", async () => {
    const { setProfile, before } = await mount("portrait");
    const details = container.querySelector("details")!;
    await act(async () => {
      details.open = true;
      details.dispatchEvent(new Event("toggle"));
    });
    for (const profile of ["landscape", "desktop", "portrait"] as const) {
      await act(async () => setProfile(profile));
      sameNodes(before);
      expect(details.open).toBe(profile !== "desktop");
    }
    await act(async () => setProfile("portrait", true));
    sameNodes(before);
    expect(container.querySelector("[data-mobile-reveal=armed]")).toBeNull();
  });
});
