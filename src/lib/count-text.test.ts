import { describe, expect, it } from "vitest";
import { parseCountText } from "@/lib/count-text";

describe("parseCountText", () => {
  it("keeps prefix, grouping and suffix around the number", () => {
    expect(parseCountText("1,600+")).toEqual({
      prefix: "",
      value: 1600,
      decimals: 0,
      grouped: true,
      suffix: "+",
    });
  });

  it("reads percentages and decimals", () => {
    expect(parseCountText("60%")).toMatchObject({ value: 60, suffix: "%", grouped: false });
    expect(parseCountText("4.5x")).toMatchObject({ value: 4.5, decimals: 1, suffix: "x" });
  });

  it("returns null when there is no number to count", () => {
    expect(parseCountText("Senior")).toBeNull();
  });
});
