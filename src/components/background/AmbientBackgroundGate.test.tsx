import { act, cleanup, render, screen } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { usePathname } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AmbientBackgroundGate } from "./AmbientBackgroundGate";

vi.mock("next/navigation", () => ({ usePathname: vi.fn(() => "/") }));
vi.mock("next/dynamic", () => ({
  default: () =>
    function MockAmbientBackground() {
      return <canvas data-testid="ambient-bg" />;
    },
}));

describe("AmbientBackgroundGate", () => {
  let root: Root | undefined;
  let container: HTMLDivElement | undefined;

  beforeEach(() => vi.mocked(usePathname).mockReturnValue("/"));
  afterEach(async () => {
    await act(async () => root?.unmount());
    root = undefined;
    container?.remove();
    container = undefined;
    cleanup();
  });

  it.each(["/", "/login", "/admin", "/admin/profile"])(
    "does not mount the canvas on %s",
    (pathname) => {
      vi.mocked(usePathname).mockReturnValue(pathname);
      render(<AmbientBackgroundGate />);
      expect(screen.queryByTestId("ambient-bg")).not.toBeInTheDocument();
    },
  );

  it("follows client navigation between an eligible page and the homepage", () => {
    vi.mocked(usePathname).mockReturnValue("/privacy");
    const { rerender } = render(<AmbientBackgroundGate />);
    expect(screen.getByTestId("ambient-bg")).toBeInTheDocument();
    vi.mocked(usePathname).mockReturnValue("/");
    rerender(<AmbientBackgroundGate />);
    expect(screen.queryByTestId("ambient-bg")).not.toBeInTheDocument();
    vi.mocked(usePathname).mockReturnValue("/privacy");
    rerender(<AmbientBackgroundGate />);
    expect(screen.getByTestId("ambient-bg")).toBeInTheDocument();
  });

  it.each(["/index", "/privacy"])("defers the canvas until hydration on %s", (pathname) => {
    vi.mocked(usePathname).mockReturnValue(pathname);
    expect(renderToString(<AmbientBackgroundGate />)).toBe("");
  });

  it("preserves the server DOM when the prerendered /index is served at /", async () => {
    const content = (
      <div>
        <AmbientBackgroundGate />
        <main>Server content</main>
      </div>
    );
    vi.mocked(usePathname).mockReturnValue("/index");
    container = document.createElement("div");
    container.innerHTML = renderToString(content);
    document.body.append(container);
    const serverMain = container.querySelector("main");
    const onRecoverableError = vi.fn();

    vi.mocked(usePathname).mockReturnValue("/");
    await act(async () => {
      root = hydrateRoot(container!, content, { onRecoverableError });
    });

    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(container.querySelector("main")).toBe(serverMain);
    expect(screen.queryByTestId("ambient-bg")).not.toBeInTheDocument();
  });
});
