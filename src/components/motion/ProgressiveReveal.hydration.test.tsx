import { act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { installMatchMedia } from "@/test/matchMedia";
import { REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { MotionProvider } from "./MotionProvider";
import { ProgressiveReveal } from "./ProgressiveReveal";

describe("ProgressiveReveal with real Motion", () => {
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
