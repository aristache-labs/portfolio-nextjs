import { act, waitFor } from "@testing-library/react";
import { motion } from "framer-motion";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { installMatchMedia } from "@/test/matchMedia";
import { useReducedMotionProps } from "./useReducedMotion";

function ScrollContent() {
  const reducedMotionProps = useReducedMotionProps();
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      {...reducedMotionProps}
    >
      Content below the fold
    </motion.div>
  );
}

describe("reduced motion hydration", () => {
  let root: Root | undefined;
  let container: HTMLDivElement | undefined;

  afterEach(async () => {
    await act(async () => root?.unmount());
    container?.remove();
  });

  it("reveals server-hidden content without requiring a viewport intersection", async () => {
    installMatchMedia({ "(prefers-reduced-motion: reduce)": true });
    container = document.createElement("div");
    container.innerHTML = renderToString(<ScrollContent />);
    document.body.append(container);
    expect(container.firstElementChild).toHaveStyle({ opacity: "0" });

    await act(async () => {
      root = hydrateRoot(container!, <ScrollContent />);
    });

    await waitFor(() => {
      expect(container?.firstElementChild).toHaveStyle({ opacity: "1" });
      expect(container?.firstElementChild).toHaveStyle({ transform: "none" });
    });
  });
});
