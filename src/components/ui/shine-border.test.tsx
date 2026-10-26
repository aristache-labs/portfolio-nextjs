import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installMatchMedia } from "@/test/matchMedia";
import { REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { ShineBorder } from "./shine-border";

const originalObserver = globalThis.IntersectionObserver;
let notify: IntersectionObserverCallback;
let target: Element;
const observe = vi.fn();
const disconnect = vi.fn();
const emit = (isIntersecting: boolean) =>
  act(() =>
    notify([{ target, isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver),
  );

beforeEach(() => {
  installMatchMedia();
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  observe.mockClear();
  disconnect.mockClear();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        notify = callback;
      }
      observe(node: Element) {
        target = node;
        observe(node);
      }
      disconnect = disconnect;
    },
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.stubGlobal("IntersectionObserver", originalObserver);
});

describe("ShineBorder", () => {
  it("uses live brand tokens and only runs while visible", () => {
    const { container } = render(<ShineBorder />);
    const border = container.firstElementChild as HTMLElement;
    expect(border).toHaveAttribute("aria-hidden", "true");
    expect(border.style.backgroundImage).toContain("var(--brand-deep)");
    expect(border.style.backgroundImage).toContain("var(--brand-mid)");
    expect(border.style.backgroundImage).toContain("var(--brand-bright)");
    expect(border).toHaveStyle({ animationPlayState: "paused" });
    emit(true);
    expect(border).toHaveStyle({ animationPlayState: "running" });
    emit(false);
    expect(border).toHaveStyle({ animationPlayState: "paused" });
  });

  it("pauses when the tab becomes hidden and resumes only if still in view", () => {
    const hidden = vi.mocked(Object.getOwnPropertyDescriptor(document, "hidden")!.get!);
    const { container } = render(<ShineBorder />);
    const border = container.firstElementChild!;
    emit(true);
    hidden.mockReturnValue(true);
    fireEvent(document, new Event("visibilitychange"));
    expect(border).toHaveStyle({ animationPlayState: "paused" });
    emit(false);
    hidden.mockReturnValue(false);
    fireEvent(document, new Event("visibilitychange"));
    expect(border).toHaveStyle({ animationPlayState: "paused" });
    emit(true);
    expect(border).toHaveStyle({ animationPlayState: "running" });
  });

  it("keeps reduced-motion decoration static without a visibility observer", () => {
    installMatchMedia({ [REDUCED_MOTION_QUERY]: true });
    const { container } = render(<ShineBorder />);
    expect(container.firstElementChild).toHaveStyle({ animationPlayState: "paused" });
    expect(observe).not.toHaveBeenCalled();
  });

  it("stops and disconnects immediately when reduced motion is enabled", () => {
    const { container, rerender } = render(<ShineBorder />);
    emit(true);
    installMatchMedia({ [REDUCED_MOTION_QUERY]: true });
    rerender(<ShineBorder />);
    expect(container.firstElementChild).toHaveStyle({ animationPlayState: "paused" });
    expect(disconnect).toHaveBeenCalled();
  });

  it("uses a visibility fallback when IntersectionObserver is unavailable", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const { container } = render(<ShineBorder />);
    await waitFor(() =>
      expect(container.firstElementChild).toHaveStyle({ animationPlayState: "running" }),
    );
  });

  it("cleans up its observer on unmount", () => {
    const { unmount } = render(<ShineBorder />);
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it("hydrates a static decorative layer without mismatches", async () => {
    const content = <ShineBorder />;
    const container = document.createElement("div");
    container.innerHTML = renderToString(content);
    document.body.append(container);
    expect(container.firstElementChild).toHaveStyle({ animationPlayState: "paused" });
    const onRecoverableError = vi.fn();
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, content, { onRecoverableError });
      });
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(container.firstElementChild).toHaveStyle({ animationPlayState: "paused" });
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });
});
