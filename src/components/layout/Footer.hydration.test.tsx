import { act } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { EXPRESSIVE_MOTION_QUERY, REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { PINNED_SCENE_QUERY } from "@/hooks/useMediaQuery";
import { Footer } from "./Footer";
import { FOOTER_MOBILE_QUERY } from "./useFooterMobileEntrance";

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
  return (profile: "portrait" | "landscape" | "desktop" | "timed", reduced = false) => {
    matches.set(FOOTER_MOBILE_QUERY, profile === "portrait" || profile === "landscape");
    matches.set(PINNED_SCENE_QUERY, profile === "desktop");
    matches.set(EXPRESSIVE_MOTION_QUERY, profile === "desktop");
    matches.set(REDUCED_MOTION_QUERY, reduced);
    for (const group of listeners.values()) for (const listener of group) listener();
  };
}

describe("Footer content identity", () => {
  let root: Root | undefined;
  let container: HTMLDivElement;

  afterEach(async () => {
    await act(async () => root?.unmount());
    root = undefined;
    container?.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const nodes = () => [...container.querySelectorAll("footer p, footer nav, footer a, footer li")];
  function sameNodes(before: ReturnType<typeof nodes>) {
    const current = nodes();
    expect(current).toHaveLength(before.length);
    current.forEach((node, index) => expect(node).toBe(before[index]));
  }

  async function mount(profile: "portrait" | "landscape" | "desktop", reduced = false) {
    const setProfile = mediaQueries();
    setProfile(profile, reduced);
    vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(5000);
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
        <Footer
          socials={[]}
          sponsorUrl="https://example.com/support"
          heroTagline="Build with care"
        />
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
    "retains server-rendered links, navigation and content after %s hydration",
    async (profile) => {
      await mount(profile);
    },
  );

  it("retains content through timed, mobile, scroll and reduced-motion modes and releases CSS properties", async () => {
    const { setProfile, before } = await mount("portrait");
    for (const profile of ["timed", "landscape", "desktop", "portrait"] as const) {
      await act(async () => setProfile(profile));
      await act(async () => {
        await new Promise(requestAnimationFrame);
      });
      sameNodes(before);
      if (profile === "timed") continue;
      const parts = container.querySelectorAll<HTMLElement>("[data-footer-part], [data-part]");
      expect(parts).toHaveLength(9);
      for (const part of parts) {
        expect(part.style.opacity).toBe("");
        expect(part.style.transform).toBe("");
      }
      for (const item of container.querySelectorAll("nav li")) {
        expect(item).not.toHaveStyle({ opacity: "0" });
      }
    }
    await act(async () => setProfile("portrait", true));
    sameNodes(before);
    expect(container.querySelector("[data-footer-reveal=armed]")).toBeNull();
  });
});
