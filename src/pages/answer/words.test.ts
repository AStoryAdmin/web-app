import { describe, expect, it } from "vitest";
import { pickLang, wordsFor, type Words } from "./words";

const ctx = { asker: "Sam", teller: "Rose" };
const banned = /legacy|memoir|deadline|before it.s too late|immigrant|\bplan\b|price|\$|subscri|trial|upgrade|gói|giá|đăng ký|dùng thử/i;

describe("answer page words", () => {
  it("picks Vietnamese for any vi tag, English otherwise", () => {
    expect(pickLang("vi")).toBe("vi");
    expect(pickLang("vi-VN")).toBe("vi");
    expect(pickLang("VI")).toBe("vi");
    expect(pickLang("en-US")).toBe("en");
    expect(pickLang("fr")).toBe("en");
    expect(pickLang(undefined)).toBe("en");
  });

  it("has every word in both languages, none empty", () => {
    const e = wordsFor("en", ctx);
    const v = wordsFor("vi", ctx);
    expect(Object.keys(v).sort()).toEqual(Object.keys(e).sort());
    for (const k of Object.keys(e) as (keyof Words)[]) {
      expect(e[k].trim(), `en.${k}`).not.toBe("");
      expect(v[k].trim(), `vi.${k}`).not.toBe("");
    }
  });

  it("never says a plan, a price or a banned word", () => {
    for (const lang of ["en", "vi"] as const) {
      for (const [k, s] of Object.entries(wordsFor(lang, ctx))) expect(s, `${lang}.${k}`).not.toMatch(banned);
    }
  });

  it("names the asker and the teller", () => {
    const e = wordsFor("en", ctx);
    expect(e.askedYou).toBe("Sam asked you");
    expect(e.send).toBe("Send to Sam");
    expect(e.sentTitle).toBe("Sent to Sam.");
    expect(e.thanks).toBe("Thank you, Rose.");
    expect(e.expired).toBe("This question has closed. Sam can send you a new one.");
    expect(e.answered).toBe("You answered this one. Sam has it.");
  });

  it("Vietnamese is neutral unless the link knows both kin words (lane L table)", () => {
    const v = wordsFor("vi", ctx);
    expect(v.askedYou).toBe("Câu hỏi của Sam");
    expect(v.hear).toBe("Nghe Sam hỏi");
    expect(v.record).toBe("Trả lời bằng giọng nói");
    expect(v.send).toBe("Gửi cho Sam");
    expect(v.sentTitle).toBe("Đã gửi cho Sam.");
    expect(v.sentVoice).toBe("Sam sẽ nhận được câu trả lời.");
    expect(v.thanks).toBe("Cảm ơn Rose.");
    expect(Object.values(v).join(" ")).not.toMatch(/(^|\s)bạn([\s.,]|$)/);
    // one side alone is not enough to use kin forms
    expect(wordsFor("vi", { ...ctx, title: "bà" }).askedYou).toBe("Câu hỏi của Sam");
    const kin = wordsFor("vi", { asker: "Sam", teller: "Lan", title: "Bà", askerKin: "cháu" });
    expect(kin.askedYou).toBe("Cháu Sam hỏi bà");
    expect(kin.hear).toBe("Nghe cháu Sam hỏi");
    expect(kin.send).toBe("Gửi cho cháu Sam");
    expect(kin.sentTitle).toBe("Đã gửi cho cháu Sam.");
    expect(kin.sentVoice).toBe("Cháu Sam sẽ nhận được câu trả lời của bà.");
    expect(kin.answered).toBe("Câu hỏi này đã được trả lời rồi. Cháu Sam đã nhận được.");
    expect(kin.thanks).toBe("Cảm ơn bà Lan.");
  });

  it("uses who the server says it went to, and copes with no names", () => {
    expect(wordsFor("en", { ...ctx, sentTo: "Sam and Mai" }).sentTitle).toBe("Sent to Sam and Mai.");
    const none = wordsFor("en", { asker: "", teller: "" });
    expect(none.askedYou).toBe("Your family asked you");
    expect(none.thanks).toBe("Thank you.");
    expect(wordsFor("vi", { asker: "", teller: "" }).askedYou).toBe("Câu hỏi của người nhà");
  });
});
