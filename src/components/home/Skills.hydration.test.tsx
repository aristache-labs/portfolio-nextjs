import { act, waitFor } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { EXPRESSIVE_MOTION_QUERY, REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { PINNED_SCENE_QUERY } from "@/hooks/useMediaQuery";
import { Skills } from "./Skills";
import { SKILLS_MOBILE_LANDSCAPE, SKILLS_MOBILE_PORTRAIT } from "./SkillsMobileReveal";

const DESKTOP = "(min-width: 1024px) and (pointer: fine)";
const skills = Array.from({ length: 12 }, (_, order) => ({
  name: `Tool ${order}`,
  iconPath: "/skills/react.svg",
  category: "Development",
  order,
  level: "90",
}));

function mediaQueries() {
  const matches = new Map<string, boolean>();
  const listeners = new Map<string, Set<() => void>>();
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
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
    })),
  );
  return (profile: "portrait" | "landscape" | "desktop", reduced = false) => {
    matches.set(SKILLS_MOBILE_PORTRAIT, profile === "portrait");
    matches.set(SKILLS_MOBILE_LANDSCAPE, profile === "landscape");
    matches.set(DESKTOP, profile === "desktop");
    matches.set(EXPRESSIVE_MOTION_QUERY, profile === "desktop");
    matches.set(PINNED_SCENE_QUERY, profile === "desktop");
    matches.set(REDUCED_MOTION_QUERY, reduced);
    for (const group of listeners.values()) for (const listener of group) listener();
  };
}

describe("Skills content identity", () => {
  let root: Root | undefined;
  let container: HTMLDivElement;

  afterEach(async () => {
    await act(async () => root?.unmount());
    root = undefined;
    container?.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function contentNodes() {
    return [
      container.querySelector("h2"),
      container.querySelector("blockquote"),
      container.querySelector("[role=tabpanel]")!.firstElementChild,
      ...Array.from(container.querySelectorAll("[title]")).slice(0, 8),
    ];
  }

  function expectSameNodes(nodes: ReturnType<typeof contentNodes>) {
    const current = contentNodes();
    expect(current).toHaveLength(nodes.length);
    current.forEach((node, index) => expect(node).toBe(nodes[index]));
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
        <Skills skills={skills} />
      </MotionProvider>
    );
    container = document.createElement("div");
    container.innerHTML = renderToString(content);
    document.body.append(container);
    const serverNodes = contentNodes();
    const recoverable = vi.fn();
    await act(async () => {
      root = hydrateRoot(container, content, { onRecoverableError: recoverable });
    });
    expect(recoverable).not.toHaveBeenCalled();
    expectSameNodes(serverNodes);
    expect(container.querySelectorAll("[title]")).toHaveLength(profile === "desktop" ? 12 : 8);
    return { setProfile, serverNodes };
  }

  it.each(["portrait", "landscape", "desktop"] as const)(
    "retains server-rendered headings, grid and shared cards after %s hydration",
    async (profile) => {
      await mount(profile);
    },
  );

  it("retains content while rotating and switching between mobile, desktop and reduced motion", async () => {
    const { setProfile, serverNodes } = await mount("portrait");
    const section = container.querySelector("#skills");
    for (const profile of ["landscape", "desktop", "portrait"] as const) {
      await act(async () => setProfile(profile));
      expectSameNodes(serverNodes);
      await waitFor(() =>
        expect(container.querySelectorAll("[title]")).toHaveLength(profile === "desktop" ? 12 : 8),
      );
      expect(section?.hasAttribute("data-scene")).toBe(profile === "desktop");
    }
    await act(async () => setProfile("portrait", true));
    expectSameNodes(serverNodes);
    expect(container.querySelector("[data-reveal=armed]")).toBeNull();
  });

  it("clears the desktop Motion values before the mobile CSS entrance takes over", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      top: 2000,
      bottom: 2100,
      left: 100,
      right: 500,
      width: 400,
      height: 100,
      x: 100,
      y: 2000,
      toJSON: () => ({}),
    });
    const { setProfile } = await mount("desktop");
    const heading = container.querySelector("h2")!.parentElement!;
    expect(heading).toHaveStyle({ opacity: "0" });
    await act(async () => setProfile("portrait"));
    await act(async () => {
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    });
    expect(container.querySelector("h2")!.parentElement).toBe(heading);
    expect(heading).toHaveStyle({ opacity: "1", transform: "none" });
    expect(heading).toHaveAttribute("data-reveal", "armed");
  });
});
