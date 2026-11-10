import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { installMatchMedia } from "@/test/matchMedia";
import { IntroCurtain } from "./IntroCurtain";
import { TerminalIntro } from "./TerminalIntro";
import { INTRO_COMMAND, introFrame } from "./intro-timeline";

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("data-intro-active");
  document.documentElement.removeAttribute("data-intro-start");
  document.documentElement.removeAttribute("data-intro-revealing");
  document.documentElement.removeAttribute("data-intro-seen");
  sessionStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function boot() {
  const { container } = render(<IntroCurtain />);
  const script = container.querySelector("script")!.textContent!;
  cleanup();
  return script;
}

describe("terminal intro", () => {
  it("starts once per session and skips subsequent visits", () => {
    installMatchMedia({ "(prefers-reduced-motion: reduce)": false });
    vi.useFakeTimers();
    const script = boot();
    window.eval(script);
    expect(document.documentElement).toHaveAttribute("data-intro-active");
    expect(sessionStorage.getItem("aristache:intro")).toBe("1");
    document.documentElement.removeAttribute("data-intro-active");
    window.eval(script);
    expect(document.documentElement).not.toHaveAttribute("data-intro-active");
  });

  it("removes the curtain at its hard deadline even without hydration", () => {
    installMatchMedia({ "(prefers-reduced-motion: reduce)": false });
    vi.useFakeTimers();
    window.eval(boot());
    expect(document.documentElement).toHaveAttribute("data-intro-active");
    vi.advanceTimersByTime(6501);
    expect(document.documentElement).not.toHaveAttribute("data-intro-active");
  });

  it("does not start for reduced motion", () => {
    installMatchMedia({ "(prefers-reduced-motion: reduce)": true });
    window.eval(boot());
    expect(document.documentElement).not.toHaveAttribute("data-intro-active");
  });

  it.each(["Escape", "Tab"])("dismisses with %s", (key) => {
    installMatchMedia({ "(prefers-reduced-motion: reduce)": false });
    document.documentElement.setAttribute("data-intro-active", "");
    render(<TerminalIntro />);
    fireEvent.keyDown(document, { key });
    expect(document.documentElement).not.toHaveAttribute("data-intro-active");
  });

  it("dismisses immediately with Skip", () => {
    document.documentElement.setAttribute("data-intro-active", "");
    render(<TerminalIntro />);
    fireEvent.click(screen.getByRole("button", { name: "Skip intro" }));
    expect(document.documentElement).not.toHaveAttribute("data-intro-active");
  });

  it("finishes and removes the overlay after five seconds", () => {
    installMatchMedia({ "(prefers-reduced-motion: reduce)": false });
    let callback: FrameRequestCallback = () => {};
    vi.stubGlobal("requestAnimationFrame", (next: FrameRequestCallback) => {
      callback = next;
      return 1;
    });
    const start = performance.now();
    document.documentElement.setAttribute("data-intro-active", "");
    document.documentElement.setAttribute("data-intro-start", String(start));
    render(<TerminalIntro />);
    act(() => callback(start + 5001));
    expect(document.documentElement).not.toHaveAttribute("data-intro-active");
  });

  it("derives readable output and a finished reveal independently of seek order", () => {
    expect(introFrame(0).command).toBe("");
    expect(introFrame(1.4).command).toBe(INTRO_COMMAND);
    expect(introFrame(3.3).lines.every((opacity) => opacity === 1)).toBe(true);
    expect(introFrame(5).finished).toBe(true);
    expect(introFrame(5).curtainOpacity).toBe(0);
    expect(introFrame(5).windowOpacity).toBe(0);
    expect(introFrame(2)).toEqual(introFrame(2));
    expect(introFrame(0).command).toBe("");
  });
});
