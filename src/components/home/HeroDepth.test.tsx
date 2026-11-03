import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HeroDepth } from "./HeroDepth";

afterEach(cleanup);

const pointer = (node: HTMLElement, type: string, clientX: number, clientY: number) => {
  const event = new Event("pointermove", { bubbles: true });
  Object.defineProperties(event, {
    pointerType: { value: type },
    clientX: { value: clientX },
    clientY: { value: clientY },
  });
  node.dispatchEvent(event);
};

describe("HeroDepth", () => {
  it("moves the pointer depth toward a mouse position on the viewport", async () => {
    const section = { current: document.createElement("section") };
    render(<HeroDepth section={section} />);
    pointer(section.current, "mouse", window.innerWidth, window.innerHeight / 2);
    await waitFor(() =>
      expect(
        parseFloat(section.current!.style.getPropertyValue("--hero-pointer-x")),
      ).toBeGreaterThan(0),
    );
    expect(parseFloat(section.current!.style.getPropertyValue("--hero-pointer-y"))).toBeCloseTo(
      0,
      1,
    );
  });

  it("ignores touch so phones never receive a pointer depth", () => {
    const section = { current: document.createElement("section") };
    render(<HeroDepth section={section} />);
    pointer(section.current, "touch", window.innerWidth, 0);
    expect(section.current.style.getPropertyValue("--hero-pointer-x")).toBe("");
    expect(section.current.style.getPropertyValue("--hero-pointer-y")).toBe("");
  });

  it("removes its custom properties when it unmounts", async () => {
    const section = { current: document.createElement("section") };
    const { unmount } = render(<HeroDepth section={section} />);
    pointer(section.current, "mouse", window.innerWidth, 0);
    await waitFor(() =>
      expect(section.current!.style.getPropertyValue("--hero-pointer-x")).not.toBe(""),
    );
    unmount();
    expect(section.current.style.getPropertyValue("--hero-pointer-x")).toBe("");
    expect(section.current.style.getPropertyValue("--hero-pointer-y")).toBe("");
  });
});
