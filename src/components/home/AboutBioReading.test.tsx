import { act, cleanup, render, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { installMatchMedia } from "@/test/matchMedia";
import { REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { AboutBioReading } from "./AboutBioReading";

const motion = vi.hoisted(() => ({ fromTo: vi.fn(), revert: vi.fn() }));
vi.mock("@/lib/gsap", () => ({
  gsap: {
    fromTo: motion.fromTo,
    context: (callback: () => void) => {
      callback();
      return { revert: motion.revert };
    },
  },
}));
beforeEach(() => {
  vi.clearAllMocks();
  installMatchMedia();
});
afterEach(cleanup);

const text = (
  <p>
    <span data-bio-word>Readable</span> <span data-bio-word>biography.</span>
  </p>
);

it("keeps complete server text without hiding words before enhancement", () => {
  const html = renderToString(<AboutBioReading className="copy">{text}</AboutBioReading>);
  expect(html).toContain("Readable");
  expect(html).not.toContain("opacity");
});

it("scrubs only word opacity and reverts the context on reduced motion", async () => {
  const { rerender } = render(<AboutBioReading className="copy">{text}</AboutBioReading>);
  await waitFor(() => expect(motion.fromTo).toHaveBeenCalledOnce());
  expect(motion.fromTo.mock.calls[0][0]).toHaveLength(2);
  expect(motion.fromTo.mock.calls[0][2]).toMatchObject({
    opacity: 1,
    scrollTrigger: { scrub: true },
  });
  installMatchMedia({ [REDUCED_MOTION_QUERY]: true });
  rerender(<AboutBioReading className="copy">{text}</AboutBioReading>);
  expect(motion.revert).toHaveBeenCalledOnce();
});

it("does not initialize animation on reduced motion", async () => {
  installMatchMedia({ [REDUCED_MOTION_QUERY]: true });
  render(<AboutBioReading className="copy">{text}</AboutBioReading>);
  await act(async () => {});
  expect(motion.fromTo).not.toHaveBeenCalled();
});

it("does not initialize after unmount while the lazy import is pending", async () => {
  const { unmount } = render(<AboutBioReading className="copy">{text}</AboutBioReading>);
  unmount();
  await act(async () => {});
  expect(motion.fromTo).not.toHaveBeenCalled();
});
