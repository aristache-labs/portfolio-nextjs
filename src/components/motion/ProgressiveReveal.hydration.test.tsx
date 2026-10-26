import { act, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { m } from "framer-motion";
import { installMatchMedia } from "@/test/matchMedia";
import {
  EXPRESSIVE_MOTION_QUERY,
  REDUCED_MOTION_QUERY,
  useAnimationPolicy,
} from "@/hooks/useAnimationPolicy";
import { MotionProvider } from "./MotionProvider";
import { ProgressiveReveal } from "./ProgressiveReveal";

function CascadeContent({ label }: { label: string }) {
  const { mode } = useAnimationPolicy();
  return (
    <ProgressiveReveal effect="cascade">
      <m.div
        key={label}
        initial={false}
        variants={{
          hidden: mode === "expressive" ? { opacity: 0, y: 16 } : { opacity: 1, y: 0 },
          visible: { opacity: 1, y: 0, transition: { duration: 0 } },
        }}
      >
        {label}
      </m.div>
    </ProgressiveReveal>
  );
}

describe("ProgressiveReveal with real Motion", () => {
  it.each([false, true])(
    "reveals a cascade once and replaces its contents immediately (desktop=%s)",
    async (desktop) => {
      const matches = { [EXPRESSIVE_MOTION_QUERY]: desktop, [REDUCED_MOTION_QUERY]: false };
      installMatchMedia(matches);
      const bounds = vi
        .spyOn(HTMLElement.prototype, "getBoundingClientRect")
        .mockReturnValue({ top: 2000 } as DOMRect);
      const originalObserver = globalThis.IntersectionObserver;
      let notify: IntersectionObserverCallback;
      vi.stubGlobal(
        "IntersectionObserver",
        class {
          constructor(callback: IntersectionObserverCallback) {
            notify = callback;
          }
          observe() {}
          disconnect() {}
        },
      );
      const content = (label: string) => (
        <MotionProvider>
          <CascadeContent label={label} />
        </MotionProvider>
      );
      const container = document.createElement("div");
      container.innerHTML = renderToString(content("First category"));
      expect(container.querySelector("[style*='opacity:0']")).toBeNull();
      document.body.append(container);
      let root: ReturnType<typeof hydrateRoot> | undefined;
      const onRecoverableError = vi.fn();
      try {
        await act(async () => {
          root = hydrateRoot(container, content("First category"), { onRecoverableError });
        });
        expect(onRecoverableError).not.toHaveBeenCalled();
        expect(container.firstElementChild).toHaveStyle({ opacity: "0" });
        expect(container.firstElementChild?.firstElementChild).toHaveStyle({
          opacity: desktop ? "0" : "1",
        });
        await act(async () =>
          notify!(
            [
              {
                target: container.firstElementChild,
                isIntersecting: true,
              } as IntersectionObserverEntry,
            ],
            {} as IntersectionObserver,
          ),
        );
        await waitFor(() => expect(container.firstElementChild).toHaveStyle({ opacity: "1" }), {
          timeout: 1600,
        });
        expect(container.firstElementChild?.firstElementChild).toHaveStyle({
          opacity: "1",
          transform: "none",
        });
        await act(async () => root?.render(content("Second category")));
        expect(container).toHaveTextContent("Second category");
        expect(container.firstElementChild?.firstElementChild).not.toHaveStyle({ opacity: "0" });
      } finally {
        await act(async () => root?.unmount());
        container.remove();
        bounds.mockRestore();
        vi.stubGlobal("IntersectionObserver", originalObserver);
      }
    },
  );

  it.each([false, true])(
    "prepares below-screen content without hiding server HTML (slide-only=%s)",
    async (slideOnly) => {
      installMatchMedia();
      const bounds = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
        top: 2000,
        left: 100,
      } as DOMRect);
      const originalObserver = globalThis.IntersectionObserver;
      vi.stubGlobal(
        "IntersectionObserver",
        class {
          observe() {}
          disconnect() {}
        },
      );
      const content = (
        <MotionProvider>
          <ProgressiveReveal effect={slideOnly ? "slide-from-right" : "fade"}>
            Biography
          </ProgressiveReveal>
        </MotionProvider>
      );
      const container = document.createElement("div");
      container.innerHTML = renderToString(content);
      expect(container.firstElementChild).not.toHaveAttribute("style");
      document.body.append(container);
      let root: ReturnType<typeof hydrateRoot> | undefined;
      const onRecoverableError = vi.fn();
      try {
        await act(async () => {
          root = hydrateRoot(container, content, { onRecoverableError });
        });
        expect(onRecoverableError).not.toHaveBeenCalled();
        const animated = slideOnly
          ? container.firstElementChild?.firstElementChild
          : container.firstElementChild;
        expect(animated).toHaveStyle({ opacity: slideOnly ? "1" : "0" });
        if (slideOnly) {
          expect((animated as HTMLElement).style.transform).toContain(
            `${window.innerWidth - 100 + 24}px`,
          );
          expect(container.firstElementChild).not.toHaveAttribute("style");
        }
        bounds.mockReturnValue({ top: -500 } as DOMRect);
        await act(async () => window.dispatchEvent(new Event("scrollend")));
        await waitFor(() => {
          expect(animated).toHaveStyle({ opacity: "1", transform: "none" });
        });
      } finally {
        await act(async () => root?.unmount());
        container.remove();
        bounds.mockRestore();
        vi.stubGlobal("IntersectionObserver", originalObserver);
      }
    },
  );

  it.each([false, true])(
    "keeps SSR and hydration visible with reduced motion=%s",
    async (reduced) => {
      installMatchMedia({ [REDUCED_MOTION_QUERY]: reduced });
      const content = (
        <MotionProvider>
          <ProgressiveReveal className="metrics">Metrics</ProgressiveReveal>
        </MotionProvider>
      );
      const container = document.createElement("div");
      container.innerHTML = renderToString(content);
      expect(container.firstElementChild).toHaveTextContent("Metrics");
      expect(container.firstElementChild).not.toHaveAttribute("style");
      document.body.append(container);
      const onRecoverableError = vi.fn();
      let root: ReturnType<typeof hydrateRoot> | undefined;
      try {
        await act(async () => {
          root = hydrateRoot(container, content, { onRecoverableError });
        });
        expect(onRecoverableError).not.toHaveBeenCalled();
        expect(container.firstElementChild).toHaveStyle({ opacity: "1", transform: "none" });
      } finally {
        await act(async () => root?.unmount());
        container.remove();
      }
    },
  );
});
