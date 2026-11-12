import { describe, expect, it } from "vitest";
import { isAdminSession, isAllowedLogin } from "./auth-callbacks";

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

describe("isAdminSession", () => {
  it("accepts only a session whose stored login is the admin's", () => {
    expect(isAdminSession({ user: { login: "Aristache-Labs" } }, "aristache-labs")).toBe(true);
    expect(isAdminSession({ user: { login: "someone-else" } }, "aristache-labs")).toBe(false);
  });

  it("refuses a missing session, a session without a login, or no admin configured", () => {
    expect(isAdminSession(null, "aristache-labs")).toBe(false);
    expect(isAdminSession({ user: {} }, "aristache-labs")).toBe(false);
    expect(isAdminSession({ user: { login: "aristache-labs" } }, undefined)).toBe(false);
  });
});
