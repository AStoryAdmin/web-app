// The plan card's words by source, and when deleting the account must warn about App Store billing.
import { describe, expect, it } from "vitest";
import type { GiftYear } from "../lib/plan";
import { APP_STORE_STEPS, keepsBilling, longDate, planWords, reasonsText } from "./accountPlan";

const gift: GiftYear = { plan: "individual", endsAt: "2027-11-12T12:00:00Z", fromName: "Rose", kind: "gift" };
const promo: GiftYear = { plan: "individual", endsAt: "2026-11-27T12:00:00Z", fromName: "", kind: "promo" };
const NO_PRICE = /[$£€]|\d+\.\d\d/;
const NO_COUNTDOWN = /days? left|trial/i;

describe("planWords", () => {
  it("free has nothing to cancel", () => {
    expect(planWords("free", null, null)).toEqual({ source: "free", name: "Free", lines: ["Nothing to pay and nothing to cancel."] });
  });

  it("an App Store subscription says where to cancel it", () => {
    const w = planWords("family", null, null);
    expect(w.source).toBe("app_store");
    expect(w.lines.join(" ")).toContain(`To change or cancel it: ${APP_STORE_STEPS}.`);
  });

  it("a cancelled subscription says when it ends and how to turn it back on", () => {
    const w = planWords("individual", null, "2026-12-01T10:00:00Z");
    expect(w.lines[0]).toBe("It’s cancelled and ends on 1 December 2026, then the account returns to Free.");
    expect(w.lines[1]).toContain(APP_STORE_STEPS);
  });

  it("Express ends on its own", () => {
    expect(planWords("express", null, null).lines[0]).toMatch(/ends on its own and nothing renews/);
  });

  it("a gift year names the giver, the end and that nothing renews", () => {
    const w = planWords("individual", gift, null);
    expect(w.source).toBe("gift");
    expect(w.name).toBe("Individual. A gift from Rose.");
    expect(w.lines).toEqual(["It ends on 12 November 2027, then the account returns to Free.", "Nothing renews and nothing is charged."]);
  });

  it("a promo month ends and nothing renews", () => {
    const w = planWords("individual", promo, null);
    expect(w.source).toBe("promo");
    expect(w.name).toBe("Individual. A month on us.");
    expect(w.lines[1]).toBe("Nothing renews and nothing is charged.");
  });

  it("an access code runs with nothing to cancel", () => {
    expect(planWords("complimentary", null, null)).toEqual({ source: "promo", name: "Full access, through an access code.", lines: ["Nothing renews and nothing is charged."] });
  });

  it("never shows a price or a countdown", () => {
    for (const w of [planWords("family", null, null), planWords("monthly", null, "2026-12-01"), planWords("individual", gift, null), planWords("individual", promo, null), planWords("express", null, null)]) {
      expect(`${w.name} ${w.lines.join(" ")}`).not.toMatch(NO_PRICE);
      expect(`${w.name} ${w.lines.join(" ")}`).not.toMatch(NO_COUNTDOWN);
    }
  });
});

describe("keepsBilling", () => {
  it("warns only for a running App Store subscription", () => {
    expect(keepsBilling("individual", null, null)).toBe(true);
    expect(keepsBilling("monthly", null, null)).toBe(true);
    expect(keepsBilling("individual", null, "2026-12-01")).toBe(false);
    expect(keepsBilling("express", null, null)).toBe(false);
    expect(keepsBilling("individual", gift, null)).toBe(false);
    expect(keepsBilling("complimentary", null, null)).toBe(false);
    expect(keepsBilling("free", null, null)).toBe(false);
  });
});

describe("longDate and reasonsText", () => {
  it("reads a date or gives nothing", () => {
    expect(longDate("2027-01-05T12:00:00Z")).toBe("5 January 2027");
    expect(longDate("not a date")).toBe("");
    expect(longDate(null)).toBe("");
  });

  it("joins the ticked reasons and what was typed", () => {
    expect(reasonsText(["It’s too expensive"], "  moving to paper ")).toBe("It’s too expensive; moving to paper");
    expect(reasonsText([], " ")).toBe("");
  });
});
