import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { installMatchMedia } from "@/test/matchMedia";
import {
  EXPRESSIVE_MOTION_QUERY,
  REDUCED_MOTION_QUERY,
  useAnimationPolicy,
} from "./useAnimationPolicy";

afterEach(cleanup);

describe("useAnimationPolicy", () => {
  it("requires the inclusive desktop breakpoint, fine pointer and hover together", () => {
    expect(EXPRESSIVE_MOTION_QUERY).toBe(
      "(min-width: 1024px) and (pointer: fine) and (hover: hover)",
    );
  });

  it.each([
    [false, false, "discreet"],
    [true, false, "expressive"],
    [false, true, "static"],
    [true, true, "static"],
  ])("classifies desktop=%s reduced=%s as %s", (desktop, reduced, mode) => {
    installMatchMedia({
      [EXPRESSIVE_MOTION_QUERY]: desktop,
      [REDUCED_MOTION_QUERY]: reduced,
    });
    const { result } = renderHook(useAnimationPolicy);
    expect(result.current).toEqual({ mode, ready: true });
  });
});
