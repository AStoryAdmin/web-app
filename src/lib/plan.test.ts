// Which plan an account is on, and where it came from: a gift year shows as
// its plan while it runs, never over a plan someone pays for.
import { describe, expect, it } from "vitest";
import { parseGiftYear, planSource, planWithGiftYear, resolveEffectivePlan, type GiftYear } from "./plan";

const NOW = new Date("2026-10-27T12:00:00Z");
const row = { plan: "individual", starts_at: "2026-10-01T00:00:00Z", ends_at: "2027-10-01T00:00:00Z", from_name: "Mai", hardcover_credits: 0, kind: "gift" };
const gift: GiftYear = { plan: "individual", endsAt: "2027-10-01T00:00:00Z", fromName: "Mai", kind: "gift" };

describe("resolveEffectivePlan", () => {
  it("puts an access code over everything", () => expect(resolveEffectivePlan("family", null, "2026-01-01")).toBe("complimentary"));
  it("lets a lapsed Express fall back to Free", () => expect(resolveEffectivePlan("express", "2000-01-01T00:00:00Z", null)).toBe("free"));
  it("reads an empty plan as Free", () => expect(resolveEffectivePlan(null, null, null)).toBe("free"));
});

describe("parseGiftYear", () => {
  it("reads the my_gift_year row, as an array or a single row", () => {
    expect(parseGiftYear([row], NOW)).toEqual(gift);
    expect(parseGiftYear(row, NOW)).toEqual(gift);
  });

  it("knows a promo month", () => expect(parseGiftYear([{ ...row, kind: "promo", from_name: "A Story" }], NOW)?.kind).toBe("promo"));

  it("is null when there is none, it has ended, or the plan is not one a person could be given", () => {
    expect(parseGiftYear([], NOW)).toBeNull();
    expect(parseGiftYear(null, NOW)).toBeNull();
    expect(parseGiftYear([{ ...row, ends_at: "2026-10-01T00:00:00Z" }], NOW)).toBeNull();
    expect(parseGiftYear([{ ...row, plan: "free" }], NOW)).toBeNull();
    expect(parseGiftYear([{ ...row, plan: "gold" }], NOW)).toBeNull();
    expect(parseGiftYear([{ ...row, ends_at: null }], NOW)).toBeNull();
  });

  it("leaves a missing name empty for the page to word", () => expect(parseGiftYear([{ ...row, from_name: null }], NOW)?.fromName).toBe(""));
});

describe("planWithGiftYear", () => {
  it("gives a Free account the gifted plan", () => expect(planWithGiftYear("free", gift)).toBe("individual"));
  it("never goes over a plan someone pays for", () => expect(planWithGiftYear("family", gift)).toBe("family"));
  it("is the own plan without a gift", () => expect(planWithGiftYear("free", null)).toBe("free"));
});

describe("planSource", () => {
  it("is free on Free", () => expect(planSource("free", null)).toBe("free"));
  it("is the App Store for a plan paid for", () => {
    expect(planSource("individual", null)).toBe("app_store");
    expect(planSource("express", null)).toBe("app_store");
  });
  it("is the gift while a gift year gives the plan", () => expect(planSource("individual", gift)).toBe("gift"));
  it("is a promo for a promo month, and for an access code", () => {
    expect(planSource("individual", { ...gift, kind: "promo" })).toBe("promo");
    expect(planSource("complimentary", null)).toBe("promo");
  });
});
