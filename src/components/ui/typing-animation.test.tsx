import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installMatchMedia } from "@/test/matchMedia";
import { REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { TypingAnimation } from "./typing-animation";
import styles from "./typing-animation.module.css";

const originalObserver = globalThis.IntersectionObserver;
const advance = (time: number) => act(() => vi.advanceTimersByTime(time));
const visualText = (container: HTMLElement) =>
  container.querySelector('[aria-hidden="true"] > span')?.textContent;

beforeEach(() => {
  vi.useFakeTimers();
  installMatchMedia();
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  vi.stubGlobal("IntersectionObserver", undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.stubGlobal("IntersectionObserver", originalObserver);
  vi.useRealTimers();
});

describe("TypingAnimation", () => {
  it("serves the complete greeting without JavaScript or a changing accessibility label", () => {
    const html = renderToString(<TypingAnimation loop>HELLO, I&apos;M</TypingAnimation>);
    expect(html).toContain("HELLO, I&#x27;M");
    expect(html).not.toContain("text-transparent");
    expect(html).not.toContain('aria-hidden="true"');
  });

  it("types, pauses for two seconds, deletes and repeats while the cursor keeps blinking", () => {
    const { container, getByText } = render(
      <TypingAnimation loop pauseDelay={2000}>
        HI
      </TypingAnimation>,
    );
    advance(16);
    expect(visualText(container)).toBe("");
    expect(getByText("HI")).toHaveClass("text-transparent");
    expect(getByText("HI")).not.toHaveAttribute("aria-hidden");
    advance(100);
    expect(visualText(container)).toBe("H");
    advance(100);
    expect(visualText(container)).toBe("HI");
    advance(1999);
    expect(visualText(container)).toBe("HI");
    expect(container.getElementsByClassName(styles.blink)).toHaveLength(1);
    advance(1);
    expect(visualText(container)).toBe("H");
    advance(50);
    expect(visualText(container)).toBe("");
    advance(100);
    expect(visualText(container)).toBe("H");
  });

  it("supports a static cursor during the pause", () => {
    const { container } = render(
      <TypingAnimation loop blinkCursor={false}>
        HI
      </TypingAnimation>,
    );
    advance(216);
    expect(visualText(container)).toBe("HI");
    expect(container.getElementsByClassName(styles.cursor)).toHaveLength(1);
    expect(container.getElementsByClassName(styles.blink)).toHaveLength(0);
  });

  it("does not delete or create more timers after a non-looping greeting finishes", () => {
    const { container } = render(<TypingAnimation pauseDelay={100}>HI</TypingAnimation>);
    advance(316);
    expect(visualText(container)).toBe("HI");
    expect(vi.getTimerCount()).toBe(0);
    advance(1000);
    expect(visualText(container)).toBe("HI");
  });

  it("keeps reduced-motion text static and cancels an active loop when the preference changes", () => {
    const { container, rerender } = render(<TypingAnimation loop>HELLO</TypingAnimation>);
    advance(116);
    expect(visualText(container)).toBe("H");
    installMatchMedia({ [REDUCED_MOTION_QUERY]: true });
    rerender(<TypingAnimation loop>HELLO</TypingAnimation>);
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(container.textContent).toBe("HELLO");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("pauses timers and the cursor while the page is hidden, then resumes", () => {
    const hidden = vi.mocked(Object.getOwnPropertyDescriptor(document, "hidden")!.get!);
    const { container } = render(<TypingAnimation loop>HI</TypingAnimation>);
    advance(116);
    hidden.mockReturnValue(true);
    fireEvent(document, new Event("visibilitychange"));
    expect(container.firstElementChild).toHaveAttribute("data-playing", "false");
    expect(vi.getTimerCount()).toBe(0);
    advance(3000);
    expect(visualText(container)).toBe("H");
    hidden.mockReturnValue(false);
    fireEvent(document, new Event("visibilitychange"));
    advance(100);
    expect(visualText(container)).toBe("HI");
    expect(container.firstElementChild).toHaveAttribute("data-playing", "true");
  });

  it("waits for the greeting to enter view and pauses when it leaves", () => {
    let notify: IntersectionObserverCallback;
    let target: Element;
    const disconnect = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          notify = callback;
        }
        observe(node: Element) {
          target = node;
        }
        disconnect = disconnect;
      },
    );
    const { container, unmount } = render(<TypingAnimation loop>HI</TypingAnimation>);
    advance(3000);
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    const emit = (isIntersecting: boolean) =>
      act(() =>
        notify!(
          [{ target: target!, isIntersecting } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        ),
      );
    emit(true);
    advance(100);
    expect(visualText(container)).toBe("H");
    emit(false);
    expect(vi.getTimerCount()).toBe(0);
    advance(3000);
    expect(visualText(container)).toBe("H");
    emit(true);
    advance(100);
    expect(visualText(container)).toBe("HI");
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it.each([0, 116, 216])("cleans up timers on unmount after %ims", (time) => {
    const { unmount } = render(<TypingAnimation loop>HI</TypingAnimation>);
    advance(time);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("preserves progress during an ordinary rerender or rotation", () => {
    const { container, rerender } = render(<TypingAnimation loop>HI</TypingAnimation>);
    advance(116);
    fireEvent.resize(window);
    rerender(
      <TypingAnimation loop className="text-muted">
        HI
      </TypingAnimation>,
    );
    expect(visualText(container)).toBe("H");
    advance(100);
    expect(visualText(container)).toBe("HI");
  });

  it("hydrates the static greeting without mismatches", async () => {
    const content = <TypingAnimation loop>HELLO</TypingAnimation>;
    const container = document.createElement("div");
    container.innerHTML = renderToString(content);
    document.body.append(container);
    const onRecoverableError = vi.fn();
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, content, { onRecoverableError });
      });
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(container.textContent).toBe("HELLO");
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });
});
