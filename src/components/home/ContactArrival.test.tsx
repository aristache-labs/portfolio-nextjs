import { StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { installMatchMedia } from "@/test/matchMedia";
import { ContactArrival } from "./ContactArrival";

const observers = new Map<Element, IntersectionObserverCallback>();

beforeEach(() => {
  observers.clear();
  installMatchMedia();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private callback: IntersectionObserverCallback) {}
      observe(target: Element) {
        observers.set(target, this.callback);
      }
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function Form() {
  return (
    <StrictMode>
      <ContactArrival kind="form">
        <form>
          <div data-contact-step>
            <input aria-label="Name" />
          </div>
          <button data-contact-step type="button">
            Send
          </button>
        </form>
      </ContactArrival>
    </StrictMode>
  );
}

function intersect(target: Element) {
  const bounds = target.getBoundingClientRect();
  act(() =>
    observers.get(target)!(
      [
        {
          target,
          isIntersecting: true,
          intersectionRatio: 1,
          boundingClientRect: bounds,
          intersectionRect: bounds,
          rootBounds: null,
          time: 0,
        },
      ],
      {} as IntersectionObserver,
    ),
  );
}

describe("mobile Contact arrivals", () => {
  it("reveals a field independently of the send button", () => {
    render(<Form />);
    const field = screen.getByRole("textbox").parentElement!;
    intersect(field);
    expect(field).toHaveAttribute("data-contact-reveal", "play");
    expect(screen.getByRole("button")).toHaveAttribute("data-contact-reveal", "armed");
  });

  it.each(["focus", "pointer"])(
    "settles the whole form on %s and ignores queued observer callbacks",
    (event) => {
      render(<Form />);
      const input = screen.getByRole("textbox");
      const button = screen.getByRole("button");
      if (event === "focus") fireEvent.focusIn(input);
      else fireEvent.pointerDown(input);
      intersect(button);
      expect(input.parentElement).toHaveAttribute("data-contact-reveal", "static");
      expect(button).toHaveAttribute("data-contact-reveal", "static");
    },
  );

  it("keeps all content visible with reduced motion", () => {
    installMatchMedia({ [REDUCED_MOTION_QUERY]: true });
    render(<Form />);
    expect(observers.size).toBe(0);
    expect(screen.getByRole("button")).not.toHaveAttribute("data-contact-reveal");
  });
});
