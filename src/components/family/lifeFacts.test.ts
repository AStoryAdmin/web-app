// Somebody's details as the person page changes them, written the way the phone writes them (personFacts factPatch).
import { describe, expect, it } from "vitest";
import { lifeDraft, lifePatch } from "./lifeFacts";
import { standingCode, untilLabel } from "./familyView";
import type { Person } from "../../data/family";

const person = (o: Record<string, unknown> = {}): Person => ({ id: "p", householdId: "h", givenName: "Henry", familyName: "Hartley", sex: "", source: "manual", ...o }) as Person;
const now = new Date(2026, 9, 27, 12);
const ok = (r: ReturnType<typeof lifePatch>) => {
  if ("error" in r) throw new Error(r.error);
  return r.person as Person & Record<string, unknown>;
};

describe("a code’s date, never a countdown", () => {
  it("says the day it stops working", () => {
    expect(untilLabel(new Date(2026, 10, 3, 12).toISOString(), now)).toBe("works until 3 Nov");
    expect(untilLabel(new Date(2027, 0, 9, 12).toISOString(), now)).toBe("works until 9 Jan 2027");
    expect(untilLabel("not a date", now)).toBe("");
    expect(untilLabel(new Date(2026, 9, 28, 12).toISOString(), now)).not.toMatch(/day|left/);
  });
});

describe("the family’s standing code", () => {
  const at = (days: number) => new Date(now.getTime() + days * 86400000).toISOString();
  it("is the story’s own code, never one made for a person, while it has more than a week to run", () => {
    const codes = [
      { code: "PERSON", storyId: "s", personId: "p", expiresAt: at(20) },
      { code: "OTHER1", storyId: "t", personId: null, expiresAt: at(20) },
      { code: "FAMILY", storyId: "s", personId: null, expiresAt: at(20) },
    ];
    expect(standingCode(codes, "s", now)?.code).toBe("FAMILY");
    expect(standingCode([{ code: "OLDONE", storyId: "s", personId: null, expiresAt: at(3) }], "s", now)).toBeNull();
    expect(standingCode(null, "s", now)).toBeNull();
  });
});

describe("a person’s life, changed in place", () => {
  it("starts from what is known, the phone’s list of jobs as one line", () => {
    const d = lifeDraft(person({ birthYear: 1912, deathYear: 1979, birthPlace: "Leeds", jobs: [{ title: "Welder", place: "the shipyard", from: "1931", to: "1960" }] }));
    expect(d).toMatchObject({ birth: "1912", birthPlace: "Leeds", passed: true, death: "1979", work: "Welder, the shipyard (1931–1960)" });
  });

  it("adds somebody who has passed away, with their years, places and facts", () => {
    const p = ok(
      lifePatch(person(), { ...lifeDraft(person()), birth: "1912", birthPlace: " Leeds ", passed: true, death: "1979", restingPlace: "St Mary’s", grewUp: "Hull", knownFor: "His garden" }, now),
    );
    expect(p).toMatchObject({ birthYear: 1912, birthPlace: "Leeds", deathYear: 1979, restingPlace: "St Mary’s", grewUp: "Hull", knownFor: "His garden" });
  });

  it("asks for the year they passed away, and checks the years against each other", () => {
    const d = lifeDraft(person({ birthYear: 1950 }));
    expect(lifePatch(person({ birthYear: 1950 }), { ...d, passed: true }, now)).toEqual({ error: "The year they passed away, as near as anyone knows." });
    expect("error" in lifePatch(person({ birthYear: 1950 }), { ...d, passed: true, death: "1940" }, now)).toBe(true);
    expect("error" in lifePatch(person(), { ...d, birth: "2099" }, now)).toBe(true);
    expect(lifePatch(person(), { ...d, given: "  " }, now)).toEqual({ error: "A first name, at least." });
  });

  it("never flattens a list of jobs that wasn’t touched, and keeps a month and day it wasn’t shown", () => {
    const jobs = [{ title: "Welder", place: "", from: "", to: "" }];
    const before = person({ jobs, birthYear: 1912, birthMonth: 3, birthDay: 12 });
    const p = ok(lifePatch(before, { ...lifeDraft(before), birthPlace: "Leeds" }, now));
    expect(p.jobs).toBe(jobs);
    expect(p).toMatchObject({ birthYear: 1912, birthMonth: 3, birthDay: 12, birthPlace: "Leeds" });
  });

  it("takes a death away with all its dates, and never marks somebody on A Story as passed", () => {
    const gone = person({ deathYear: 1979, deathPlace: "York" });
    const p = ok(lifePatch(gone, { ...lifeDraft(gone), passed: false }, now));
    expect(p).toMatchObject({ deathYear: null, deathPlace: null });
    const onApp = person({ userId: "u1", email: "h@example.com" });
    const q = ok(lifePatch(onApp, { ...lifeDraft(onApp), passed: true, death: "2001", email: "other@example.com" }, now));
    expect(q.deathYear).toBeUndefined();
    expect(q.email).toBe("h@example.com");
  });

  it("writes a typed work line the way the phone does, as one job", () => {
    const p = ok(lifePatch(person(), { ...lifeDraft(person()), work: "Teacher" }, now));
    expect(p.work).toBe("Teacher");
    expect(p.jobs).toEqual([{ title: "Teacher", place: "", from: "", to: "" }]);
  });
});
