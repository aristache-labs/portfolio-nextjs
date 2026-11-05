import { act, cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { fixture } from "@/test/project-fixture";
import { ProjectCoverGate } from "./ProjectCoverGate";
import { FeaturedCard } from "./HighlightCards";
import { createElement } from "react";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    loading,
    fetchPriority,
  }: {
    src: string;
    alt: string;
    loading: string;
    fetchPriority: string;
  }) => createElement("img", { src, alt, loading, fetchPriority }),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("assigns cover sources only after Projects enters the one-viewport margin", () => {
  let intersect: IntersectionObserverCallback = () => {};
  let margin = "";
  const disconnect = vi.fn();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit) {
        intersect = callback;
        margin = options.rootMargin ?? "";
      }
      observe() {}
      disconnect = disconnect;
    },
  );
  const tree = (
    <ProjectCoverGate>
      <FeaturedCard
        project={fixture(1, { coverImage: "/cover.webp" })}
        eager
        onQuickView={() => {}}
      />
    </ProjectCoverGate>
  );
  expect(renderToString(tree)).toContain("<noscript>");
  const { container } = render(tree);
  expect(container.querySelector("img")).toBeNull();
  expect(margin).toBe(`${window.innerHeight}px 0px`);
  act(() =>
    intersect([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver),
  );
  const image = container.querySelector("img");
  expect(image).toHaveAttribute("loading", "eager");
  expect(image).toHaveAttribute("fetchpriority", "low");
  expect(screen.getByRole("heading", { name: "Project 1" })).toBeVisible();
  expect(disconnect).toHaveBeenCalled();
});
