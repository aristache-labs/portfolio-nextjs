import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installMatchMedia } from "@/test/matchMedia";
import { EXPRESSIVE_MOTION_QUERY, REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { EncryptedText } from "./encrypted-text";

beforeEach(() => {
  vi.useFakeTimers();
  installMatchMedia();
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const advance = (time: number) => act(() => vi.advanceTimersByTime(time));

describe("EncryptedText", () => {
  it("serves the original text without generating random server markup", () => {
    const random = vi.spyOn(Math, "random");
    const html = renderToString(<EncryptedText text="IT Specialist" />);
    expect(html).toContain("IT Specialist");
    expect(html).not.toContain('aria-hidden="true"');
    expect(random).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    "reveals progressively on desktop=%s and stops after completion",
    (desktop) => {
      installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: desktop });
      const random = vi.spyOn(Math, "random").mockReturnValue(0);
      const { container, getByText } = render(<EncryptedText text="IT" charset="X" />);
      advance(16);
      const original = getByText("IT");
      expect(original).toHaveClass("text-transparent");
      expect(original).not.toHaveAttribute("aria-hidden");
      expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent("XX");
      advance(50);
      expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent("IX");
      advance(50);
      expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
      expect(original).not.toHaveClass("text-transparent");
      const calls = random.mock.calls.length;
      advance(1000);
      expect(random).toHaveBeenCalledTimes(calls);
    },
  );

  it("preserves spaces and reserves the original text width under the overlay", () => {
    const { container, getByText } = render(<EncryptedText text="IT WEB" charset="X" />);
    advance(16);
    expect(container.querySelector('[aria-hidden="true"]')?.textContent).toBe("XX XXX");
    const original = getByText("IT WEB");
    expect(original).toHaveStyle({ gridArea: "1 / 1" });
    expect(original).not.toHaveAttribute("aria-hidden");
    advance(400);
    expect(getByText("IT WEB")).toBe(original);
    expect(original).not.toHaveClass("text-transparent");
  });

  it("keeps reduced-motion text static without scrambling or replaying later", () => {
    installMatchMedia({ [REDUCED_MOTION_QUERY]: true });
    const random = vi.spyOn(Math, "random");
    const { container, rerender } = render(<EncryptedText text="Automation" />);
    advance(200);
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    installMatchMedia();
    rerender(<EncryptedText text="Automation" />);
    advance(1000);
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(random).not.toHaveBeenCalled();
  });

  it("cancels an active reveal immediately when reduced motion is enabled", () => {
    const { container, rerender } = render(<EncryptedText text="Automation" charset="X" />);
    advance(16);
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    installMatchMedia({ [REDUCED_MOTION_QUERY]: true });
    rerender(<EncryptedText text="Automation" charset="X" />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    advance(16);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("stops scrambling when the page becomes hidden", () => {
    const { container, unmount } = render(<EncryptedText text="Automation" charset="X" />);
    advance(16);
    vi.mocked(Object.getOwnPropertyDescriptor(document, "hidden")!.get!).mockReturnValue(true);
    fireEvent(document, new Event("visibilitychange"));
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([0, 16])("cleans up pending work when unmounted after %ims", (delay) => {
    const { unmount } = render(<EncryptedText text="Automation" charset="X" />);
    advance(delay);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not restart after a resize or ordinary rerender", () => {
    const { container, rerender } = render(<EncryptedText text="IT" charset="X" />);
    advance(200);
    fireEvent.resize(window);
    rerender(<EncryptedText text="IT" charset="X" className="text-muted" />);
    advance(200);
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it("replaces changed text without retaining characters from the previous animation", () => {
    const { container, rerender } = render(<EncryptedText text="Automation" charset="X" />);
    advance(16);
    rerender(<EncryptedText text="WEB" charset="X" />);
    expect(container.textContent).toBe("WEB");
    advance(16);
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent("XXX");
    advance(200);
    expect(container.textContent).toBe("WEB");
  });

  it("hydrates the original text without mismatches", async () => {
    const content = <EncryptedText text="IT Specialist" />;
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
      expect(container.textContent).toBe("IT Specialist");
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });
});
