import { describe, expect, it } from "vitest";
import { arrivalChoices, arrivalDate, checkGiftForm, dayMonth, GIFT_INCLUDES, looksLikeGiftCode, nextLines, spacedGiftCode, type GiftForm } from "./giftWords";

const NOV = new Date(2026, 10, 20);
const base: GiftForm = { recipientName: "Hien", recipientEmail: "", note: "", firstQuestion: "", arrival: "christmas", otherDay: "", buyerName: "Daniel", buyerEmail: "d@example.com" };

describe("the gift's words", () => {
  it("offers Christmas morning while it is ahead, and dates each choice", () => {
    expect(arrivalChoices(NOV).map((c) => c.key)).toEqual(["today", "christmas", "day"]);
    expect(arrivalChoices(new Date(2026, 11, 26)).map((c) => c.key)).toEqual(["today", "day"]);
    expect(arrivalDate("christmas", "", NOV)).toBe("2026-12-25");
    expect(arrivalDate("today", "", NOV)).toBe("2026-11-20");
    expect(arrivalDate("day", "2027-02-14", NOV)).toBe("2027-02-14");
    expect(arrivalDate("day", "", NOV)).toBe("");
  });
  it("says what is wrong, one field at a time, and nothing when it is right", () => {
    expect(checkGiftForm(base, NOV)).toBeNull();
    expect(checkGiftForm({ ...base, recipientName: " " }, NOV)?.field).toBe("recipientName");
    expect(checkGiftForm({ ...base, recipientEmail: "hien@" }, NOV)?.field).toBe("recipientEmail");
    expect(checkGiftForm({ ...base, arrival: "day" }, NOV)?.field).toBe("otherDay");
    expect(checkGiftForm({ ...base, arrival: "day", otherDay: "2026-11-01" }, NOV)?.field).toBe("otherDay");
    expect(checkGiftForm({ ...base, buyerEmail: "nope" }, NOV)?.field).toBe("buyerEmail");
  });
  it("prints codes in two fours and refuses the letters a code never uses", () => {
    expect(spacedGiftCode("k7m2-qx9p")).toBe("K7M2 QX9P");
    expect(looksLikeGiftCode("K7M2 QX9P")).toBe(true);
    expect(looksLikeGiftCode("K7M2QXOP")).toBe(false);
    expect(dayMonth("2026-12-25")).toBe("25 December");
  });
  it("says plainly what the $99 is: a year that doesn't renew, the hardcover, the card, the day", () => {
    const all = GIFT_INCLUDES.map((i) => `${i.head}. ${i.line}`).join(" ");
    expect(all).toMatch(/doesn’t renew/);
    expect(all).toMatch(/Classic Hardcover/);
    expect(all).toMatch(/card/);
    expect(all).not.toMatch(/legacy|memoir|deadline|immigrant/i);
  });
  it("what happens next names the person, never 'they'", () => {
    const l = nextLines({ recipientName: "Hien Nguyen", deliverOn: "2026-12-25", emailed: true }).join(" ");
    expect(l).toMatch(/We email Hien on the morning of 25 December/);
    expect(l).not.toMatch(/\bthey\b|\bthem\b/i);
    expect(nextLines({ recipientName: "Hien", deliverOn: "2026-12-25", emailed: false })[0]).toMatch(/Print the card/);
  });
});

import { codeKind, longDay, PROMO_LINES } from "./giftWords";
describe("promotion codes (FB-531)", () => {
  it("tells a gift code from a promo code, in any case", () => {
    expect(codeKind("K7M2 QX9P")).toBe("gift");
    expect(codeKind("Ilovemyfamily2026")).toBe("promo");
    expect(codeKind("ilovemyfamily2026")).toBe("promo");
    expect(codeKind("!!")).toBe("bad");
  });
  it("says it plainly, with no price or countdown", () => {
    const all = Object.values(PROMO_LINES).join(" ");
    expect(all).toMatch(/A free month of A Story/);
    expect(all).not.toMatch(/\$|price|hurry|only \d+ days|left/i);
    expect(longDay("2026-11-23T10:00:00Z")).toBe("23 November 2026");
  });
});
