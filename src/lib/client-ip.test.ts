import { describe, expect, it } from "vitest";
import { clientIpFromHeaders } from "./client-ip";

const headers = (init: Record<string, string>) => new Headers(init);

describe("clientIpFromHeaders", () => {
  it("trusts x-real-ip over a x-forwarded-for the visitor wrote", () => {
    expect(
      clientIpFromHeaders(headers({ "x-real-ip": "203.0.113.7", "x-forwarded-for": "1.2.3.4" })),
    ).toBe("203.0.113.7");
  });

  it("falls back to the first x-forwarded-for value", () => {
    expect(clientIpFromHeaders(headers({ "x-forwarded-for": "198.51.100.2, 10.0.0.1" }))).toBe(
      "198.51.100.2",
    );
  });

  it("uses one shared bucket when no header is present", () => {
    expect(clientIpFromHeaders(headers({}))).toBe("unknown");
  });
});
