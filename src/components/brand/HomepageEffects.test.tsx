import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { HomepageEffects } from "./HomepageEffects";

vi.mock("./IntroCurtain", () => ({ IntroCurtain: () => <div data-testid="intro" /> }));
vi.mock("@/components/common/RotateHintGate", () => ({
  RotateHintGate: () => <div data-testid="rotate" />,
}));
afterEach(cleanup);

it.each([
  [{}, true, true],
  [{ intro: false }, false, true],
  [{ rotateHint: false }, true, false],
  [{ intro: false, rotateHint: false }, false, false],
  [{ intro: true, rotateHint: true }, true, true],
] as const)("mounts only enabled homepage effects for %j", (visibility, intro, rotate) => {
  render(<HomepageEffects visibility={visibility} />);
  expect(screen.queryByTestId("intro") !== null).toBe(intro);
  expect(screen.queryByTestId("rotate") !== null).toBe(rotate);
});
