import { describe, expect, it } from "vitest";
import { sentAnswer } from "./contributions";

describe("sentAnswer (submit_contribution's answer)", () => {
  it("reads today's boolean", () => {
    expect(sentAnswer(true)).toEqual({ ok: true, id: null });
    expect(sentAnswer(false)).toEqual({ ok: false, id: null });
    expect(sentAnswer(null)).toEqual({ ok: false, id: null });
  });
  it("keeps the new row's id when the RPC gives one", () => {
    expect(sentAnswer("c0ffee00-0000-4000-8000-000000000001")).toEqual({ ok: true, id: "c0ffee00-0000-4000-8000-000000000001" });
    expect(sentAnswer({ id: "abc" })).toEqual({ ok: true, id: "abc" });
    expect(sentAnswer({ ok: false })).toEqual({ ok: false, id: null });
  });
});
