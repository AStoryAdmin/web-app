// The address handed to Verify: router state first, this tab's sessionStorage after a reload, never the URL.
import { beforeEach, describe, expect, it } from "vitest";
import { carriedEmail, clearHandoff, handOff, readHandoff } from "./handoff";

beforeEach(() => window.sessionStorage.clear());

describe("handoff", () => {
  it("reads the router state", () => {
    expect(readHandoff({ email: "ann@example.com", mode: "email" })).toEqual({ email: "ann@example.com", mode: "email" });
  });

  it("survives a reload through sessionStorage", () => {
    handOff({ email: "ann@example.com", mode: "email", create: { name: "Ann Lee", code: "K7M2QX" } });
    expect(readHandoff(null)).toEqual({ email: "ann@example.com", mode: "email", create: { name: "Ann Lee", code: "K7M2QX" } });
  });

  it("prefers the router state over a stale copy", () => {
    handOff({ email: "old@example.com", mode: "signup" });
    expect(readHandoff({ email: "new@example.com", mode: "signup" })?.email).toBe("new@example.com");
  });

  it("is gone once cleared", () => {
    handOff({ email: "ann@example.com", mode: "signup" });
    clearHandoff();
    expect(readHandoff(undefined)).toBeNull();
  });

  it("treats anything else as a sign-up code, and nonsense as nothing", () => {
    expect(readHandoff({ email: "a@b.co", mode: "other" })?.mode).toBe("signup");
    expect(readHandoff({ email: "  " })).toBeNull();
    expect(readHandoff("a@b.co")).toBeNull();
  });

  it("carries an address back to a form", () => {
    expect(carriedEmail({ email: "ann@example.com" })).toBe("ann@example.com");
    expect(carriedEmail(null)).toBe("");
    expect(carriedEmail({ email: 4 })).toBe("");
  });
});
