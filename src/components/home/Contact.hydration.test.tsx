import { act, fireEvent } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { EXPRESSIVE_MOTION_QUERY, REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { PINNED_SCENE_QUERY } from "@/hooks/useMediaQuery";
import { Contact } from "./Contact";
import { CONTACT_LANDSCAPE_QUERY, CONTACT_PORTRAIT_QUERY } from "./ContactArrival";

vi.mock("next/font/google", () => ({
  Merienda: () => ({ className: "quote-font", style: { fontFamily: "Merienda" } }),
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
    matches.set(CONTACT_PORTRAIT_QUERY, profile === "portrait");
    matches.set(CONTACT_LANDSCAPE_QUERY, profile === "landscape");
    matches.set("(max-width: 1023px)", profile !== "desktop");
    matches.set("(orientation: landscape)", profile !== "portrait");
    matches.set(PINNED_SCENE_QUERY, profile === "desktop");
    matches.set(EXPRESSIVE_MOTION_QUERY, profile === "desktop");
    matches.set(REDUCED_MOTION_QUERY, reduced);
    for (const group of listeners.values()) for (const cb of group) cb();
  };
}

describe("Contact responsive identity", () => {
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
      ...container.querySelectorAll(
        "h2, ul a, figure, form, input, textarea, [role=combobox], button[type=submit]",
      ),
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
        <Contact
          email="hello@example.com"
          socials={[
            {
              platform: "linkedin",
              url: "https://linkedin.com/in/example",
              username: "example",
              order: 0,
            },
          ]}
        />
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
    "retains the SSR heading, links, quote and form after %s hydration",
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
  it("keeps edits, focus and selection while switching animation drivers", async () => {
    const { setProfile, before } = await mount("portrait");
    const name = container.querySelector<HTMLInputElement>("#contact-name")!;
    const message = container.querySelector<HTMLTextAreaElement>("#contact-message")!;
    fireEvent.change(name, { target: { value: "Test User" } });
    fireEvent.change(message, { target: { value: "A project question for testing." } });
    act(() => {
      message.focus();
      message.setSelectionRange(2, 7);
    });
    for (const profile of ["landscape", "desktop", "portrait"] as const) {
      await act(async () => setProfile(profile));
      same(before);
      expect(document.activeElement).toBe(message);
      expect(name).toHaveValue("Test User");
      expect(message).toHaveValue("A project question for testing.");
      expect([message.selectionStart, message.selectionEnd]).toEqual([2, 7]);
    }
  });
});
