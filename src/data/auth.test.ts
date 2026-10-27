// Accounts: the emailed-code sign-in, a password change that needs the reauthentication code, and reset links.
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = {
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
  updateUser: vi.fn(),
  reauthenticate: vi.fn(),
  getSession: vi.fn(),
  getUser: vi.fn(),
};
// The profile row and my_gift_year(), for the plan read.
const db = { profile: null as Record<string, unknown> | null, rpc: vi.fn() };
const from = () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: db.profile, error: null }) }) }) });
vi.mock("../lib/supabase", () => ({ getSupabase: () => ({ auth, from, rpc: db.rpc }) }));

import {
  changePassword,
  currentUser,
  friendlyAuthError,
  MIN_PASSWORD,
  needsReauthentication,
  readRecoveryLink,
  sendEmailCode,
  verifyEmailCode,
} from "./auth";

beforeEach(() => {
  for (const f of Object.values(auth)) f.mockReset();
  db.rpc.mockReset();
  db.profile = null;
});

describe("currentUser plan", () => {
  const signedIn = () => {
    const user = { id: "u1", email: "ann@example.com", user_metadata: {}, created_at: null };
    auth.getSession.mockResolvedValue({ data: { session: { user } } });
    auth.getUser.mockResolvedValue({ data: { user }, error: null });
  };
  const year = { plan: "individual", starts_at: "2026-01-01T00:00:00Z", ends_at: "2999-01-01T00:00:00Z", from_name: "Mai", hardcover_credits: 0, kind: "gift" };

  it("shows a gift recipient the gifted plan", async () => {
    signedIn();
    db.profile = { plan: "free" };
    db.rpc.mockResolvedValue({ data: [year], error: null });
    const u = await currentUser();
    expect(db.rpc).toHaveBeenCalledWith("my_gift_year");
    expect(u).toMatchObject({ plan: "individual", planSource: "gift", giftYear: { fromName: "Mai", kind: "gift" } });
  });

  it("does not ask about gifts over a paid plan", async () => {
    signedIn();
    db.profile = { plan: "family" };
    const u = await currentUser();
    expect(db.rpc).not.toHaveBeenCalled();
    expect(u).toMatchObject({ plan: "family", planSource: "app_store", giftYear: null });
  });

  it("stays Free when the gift read fails", async () => {
    signedIn();
    db.profile = { plan: "free" };
    db.rpc.mockRejectedValue(new Error("offline"));
    expect(await currentUser()).toMatchObject({ plan: "free", planSource: "free", giftYear: null });
  });
});

describe("MIN_PASSWORD", () => {
  it("is the app's eight", () => expect(MIN_PASSWORD).toBe(8));
});

describe("sendEmailCode", () => {
  it("signs in an existing account without making one", async () => {
    auth.signInWithOtp.mockResolvedValue({ error: null });
    expect(await sendEmailCode("  Ann@Example.com ")).toEqual({ ok: true });
    expect(auth.signInWithOtp).toHaveBeenCalledWith({ email: "ann@example.com", options: { shouldCreateUser: false } });
  });

  it("makes the account with the name and family code, as sign-up does", async () => {
    auth.signInWithOtp.mockResolvedValue({ error: null });
    await sendEmailCode("ann@example.com", { createUser: true, name: "Ann Marie Lee", code: "k7m2qx" });
    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      email: "ann@example.com",
      options: {
        shouldCreateUser: true,
        data: { first_name: "Ann Marie", last_name: "Lee", referral_code: "K7M2QX", signed_up_on: "web" },
      },
    });
  });

  it("says plainly when there is no such account", async () => {
    auth.signInWithOtp.mockResolvedValue({ error: { message: "Signups not allowed for otp", status: 422 } });
    const r = await sendEmailCode("nobody@example.com");
    expect(r).toMatchObject({ ok: false, noAccount: true });
  });

  it("asks them to wait after a code was just sent", async () => {
    auth.signInWithOtp.mockResolvedValue({ error: { message: "For security purposes, you can only request this after 40 seconds.", status: 429 } });
    const r = await sendEmailCode("ann@example.com");
    expect(r.ok).toBe(false);
    expect(r.ok ? "" : r.error).toMatch(/a moment ago/);
  });
});

describe("verifyEmailCode", () => {
  it("checks the code as type email", async () => {
    auth.verifyOtp.mockResolvedValue({ data: { session: { user: { id: "u" } } }, error: null });
    expect(await verifyEmailCode("Ann@example.com", " 123456 ")).toEqual({ ok: true });
    expect(auth.verifyOtp).toHaveBeenCalledWith({ email: "ann@example.com", token: "123456", type: "email" });
  });

  it("fails without a session", async () => {
    auth.verifyOtp.mockResolvedValue({ data: { session: null }, error: null });
    expect((await verifyEmailCode("a@b.co", "123456")).ok).toBe(false);
  });
});

describe("changePassword", () => {
  it("saves straight away when Supabase allows it", async () => {
    auth.updateUser.mockResolvedValue({ error: null });
    expect(await changePassword("a-new-password")).toEqual({ ok: true });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "a-new-password" });
    expect(auth.reauthenticate).not.toHaveBeenCalled();
  });

  it("emails the code and asks for it when Supabase needs reauthentication", async () => {
    auth.updateUser.mockResolvedValue({ error: { message: "Password update requires reauthentication.", code: "reauthentication_needed" } });
    auth.reauthenticate.mockResolvedValue({ error: null });
    const r = await changePassword("a-new-password");
    expect(auth.reauthenticate).toHaveBeenCalledOnce();
    expect(r).toMatchObject({ ok: false, needsCode: true });
  });

  it("passes the code as the nonce", async () => {
    auth.updateUser.mockResolvedValue({ error: null });
    expect(await changePassword("a-new-password", " 654321 ")).toEqual({ ok: true });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "a-new-password", nonce: "654321" });
  });

  it("asks again for a wrong code", async () => {
    auth.updateUser.mockResolvedValue({ error: { message: "Reauthentication nonce is invalid", code: "reauthentication_not_valid" } });
    const r = await changePassword("a-new-password", "000000");
    expect(r).toMatchObject({ ok: false, needsCode: true });
    expect(auth.reauthenticate).not.toHaveBeenCalled();
  });
});

describe("needsReauthentication", () => {
  it("reads the code or the message", () => {
    expect(needsReauthentication({ code: "reauthentication_needed" })).toBe(true);
    expect(needsReauthentication({ message: "Password update requires reauthentication." })).toBe(true);
    expect(needsReauthentication({ message: "Invalid login credentials" })).toBe(false);
    expect(needsReauthentication(null)).toBe(false);
  });
});

describe("friendlyAuthError", () => {
  it("names the eight-character rule", () => {
    expect(friendlyAuthError("Password should be at least 8 characters")).toMatch(/8 characters/);
  });
  it("doesn't call the same password too short", () => {
    expect(friendlyAuthError("New password should be different from the old password.")).toMatch(/password you have now/);
  });
});

describe("readRecoveryLink", () => {
  it("knows an implicit recovery", () => {
    expect(readRecoveryLink("#access_token=t&refresh_token=r&type=recovery", "")).toBe("recovery");
  });
  it("waits on a PKCE code", () => {
    expect(readRecoveryLink("", "?code=abc")).toBe("pending");
  });
  it("reads a link that has run out", () => {
    expect(readRecoveryLink("#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid", "")).toBe("expired");
    expect(readRecoveryLink("", "?error_code=otp_expired")).toBe("expired");
  });
  it("ignores an ordinary address", () => {
    expect(readRecoveryLink("", "")).toBeNull();
    expect(readRecoveryLink("#top", "?next=%2F")).toBeNull();
  });
});
