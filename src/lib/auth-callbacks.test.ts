import { describe, expect, it } from "vitest";
import { isAllowedLogin } from "./auth-callbacks";

describe("isAllowedLogin", () => {
  it("allows the configured admin login (case-insensitive)", () => {
    expect(isAllowedLogin("aristache-labs", "aristache-labs")).toBe(true);
    expect(isAllowedLogin("Aristache-Labs", "aristache-labs")).toBe(true);
  });
  it("rejects any other login", () => {
    expect(isAllowedLogin("someone-else", "aristache-labs")).toBe(false);
  });
  it("rejects null/undefined login", () => {
    expect(isAllowedLogin(null, "aristache-labs")).toBe(false);
    expect(isAllowedLogin(undefined, "aristache-labs")).toBe(false);
  });
  it("rejects everyone when admin login is unset", () => {
    expect(isAllowedLogin("aristache-labs", undefined)).toBe(false);
  });
});
