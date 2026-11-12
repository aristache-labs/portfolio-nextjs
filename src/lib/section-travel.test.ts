import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { beginSectionNavigation, createTravelGate, sectionTravelSkips } from "./section-navigation";

let destination: HTMLElement;
let passed: HTMLElement;
let inside: HTMLElement;

const place = (top: number, bottom: number) =>
  vi.spyOn(passed, "getBoundingClientRect").mockReturnValue({ top, bottom } as DOMRect);

beforeEach(() => {
  document.body.innerHTML = `
    <section id="dest"><p id="inside"></p></section>
    <section id="passed"><p></p></section>`;
  destination = document.getElementById("dest")!;
  inside = document.getElementById("inside")!;
  passed = document.getElementById("passed")!;
  vi.stubGlobal("innerHeight", 800);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("section travel", () => {
  it("skips only what is outside the destination while a jump is travelling", () => {
    expect(sectionTravelSkips(passed)).toBe(false);
    const finish = beginSectionNavigation(destination);
    expect(sectionTravelSkips(passed)).toBe(true);
    expect(sectionTravelSkips(inside)).toBe(false);
    finish(true);
    expect(sectionTravelSkips(passed)).toBe(false);
  });

  it("never flags anything when no jump is travelling", () => {
    const gate = createTravelGate(passed, vi.fn());
    expect(gate.passing()).toBe(false);
    expect(gate.isSkipped()).toBe(false);
    gate.dispose();
  });

  it("starts a passed element when the jump lands with it on screen", () => {
    place(100, 300);
    const onLanded = vi.fn();
    const gate = createTravelGate(passed, onLanded);
    const finish = beginSectionNavigation(destination);
    expect(gate.passing()).toBe(true);
    expect(gate.isSkipped()).toBe(true);
    expect(onLanded).not.toHaveBeenCalled();
    finish(true);
    expect(onLanded).toHaveBeenCalledTimes(1);
    expect(gate.isSkipped()).toBe(false);
    gate.dispose();
  });

  it("keeps an element that ended up above the screen waiting for its first visit", () => {
    place(-500, -300);
    const onLanded = vi.fn();
    const gate = createTravelGate(passed, onLanded);
    const finish = beginSectionNavigation(destination);
    gate.passing();
    finish(true);
    expect(onLanded).not.toHaveBeenCalled();
    expect(gate.isSkipped()).toBe(true);
    gate.dispose();
  });

  it("stops listening once disposed", () => {
    place(100, 300);
    const onLanded = vi.fn();
    const gate = createTravelGate(passed, onLanded);
    const finish = beginSectionNavigation(destination);
    gate.passing();
    gate.dispose();
    finish(true);
    expect(onLanded).not.toHaveBeenCalled();
  });

  it("starts an interrupted jump's passed element too", () => {
    place(100, 300);
    const onLanded = vi.fn();
    const gate = createTravelGate(passed, onLanded);
    const finish = beginSectionNavigation(destination);
    gate.passing();
    finish(false);
    expect(onLanded).toHaveBeenCalledTimes(1);
    gate.dispose();
  });
});
