import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installMatchMedia } from "@/test/matchMedia";
import { PORTRAIT_PHONE_QUERY } from "@/hooks/useMediaQuery";
import RotateHint from "./RotateHint";

vi.mock("next/navigation", () => ({ usePathname: vi.fn(() => "/") }));

const PORTRAIT_TOUCH = `${PORTRAIT_PHONE_QUERY} and (pointer: coarse)`;
const HINT = /rotate your device for the full experience/i;

beforeEach(() => {
  sessionStorage.clear();
  vi.mocked(usePathname).mockReturnValue("/");
  installMatchMedia({ [PORTRAIT_TOUCH]: true });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("RotateHint overlay", () => {
  it("covers the first homepage view on a portrait phone", () => {
    render(<RotateHint everyVisit={false} />);
    expect(screen.getByRole("status")).toHaveTextContent(/shift your perspective/i);
    expect(screen.getByRole("status")).toHaveTextContent(HINT);
    expect(screen.getByRole("status")).toHaveTextContent(/tap to continue/i);
  });

  it("never shows on screens that are not portrait touch phones", () => {
    installMatchMedia({ [PORTRAIT_TOUCH]: false });
    render(<RotateHint everyVisit={false} />);
    expect(screen.queryByText(HINT)).not.toBeInTheDocument();
  });

  it("only belongs on the homepage", () => {
    vi.mocked(usePathname).mockReturnValue("/privacy");
    render(<RotateHint everyVisit={false} />);
    expect(screen.queryByText(HINT)).not.toBeInTheDocument();
  });

  it("shows once per session", () => {
    const { unmount } = render(<RotateHint everyVisit={false} />);
    expect(sessionStorage.getItem("aristache:rotate-hint")).not.toBeNull();
    unmount();
    render(<RotateHint everyVisit={false} />);
    expect(screen.queryByText(HINT)).not.toBeInTheDocument();
  });

  it("leaves by itself after about six seconds", () => {
    vi.useFakeTimers();
    render(<RotateHint everyVisit={false} />);
    expect(screen.getByText(HINT)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(6500));
    expect(screen.getByRole("status")).toHaveAttribute("data-phase", "leaving");
    act(() => vi.advanceTimersByTime(300));
    expect(screen.queryByText(HINT)).not.toBeInTheDocument();
  });

  it.each(["pointerdown", "touchstart", "wheel", "keydown", "scroll"])(
    "fades on %s and unmounts when the fade finishes",
    (type) => {
      vi.useFakeTimers();
      render(<RotateHint everyVisit={false} />);
      act(() => {
        fireEvent(window, new Event(type, { bubbles: true }));
      });
      const overlay = screen.getByRole("status");
      expect(overlay).toHaveAttribute("data-phase", "leaving");
      expect(overlay.className).toMatch(/leaving/);
      act(() => vi.advanceTimersByTime(300));
      expect(screen.queryByText(HINT)).not.toBeInTheDocument();
    },
  );

  it("blocks controls until the dismissal fade finishes", () => {
    vi.useFakeTimers();
    const activate = vi.fn();
    render(
      <>
        <button onClick={activate}>Underlying action</button>
        <RotateHint />
      </>,
    );
    const button = screen.getByRole("button", { name: "Underlying action" });
    fireEvent.pointerDown(button);
    expect(screen.getByRole("status")).toHaveAttribute("data-phase", "leaving");
    fireEvent.click(button);
    act(() => vi.advanceTimersByTime(200));
    fireEvent.click(button);
    expect(activate).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(40));
    fireEvent.click(button);
    expect(activate).toHaveBeenCalledOnce();
  });

  it("keeps the phone and the picture as decoration, hidden from assistive tech", () => {
    const { container } = render(<RotateHint everyVisit={false} />);
    const scene = container.querySelector("[aria-hidden='true']");
    expect(scene?.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("can be set to show on every visit while it is being reviewed", () => {
    const { unmount } = render(<RotateHint everyVisit />);
    expect(sessionStorage.getItem("aristache:rotate-hint")).toBeNull();
    unmount();
    render(<RotateHint everyVisit />);
    expect(screen.getByText(HINT)).toBeInTheDocument();
  });
});
