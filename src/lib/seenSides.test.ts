import { beforeEach, describe, expect, it } from "vitest";
import { groupSides, markSeen, newFromLine, newSides, seenCount } from "./seenSides";
import type { Contribution } from "../data/contributions";

const side = (over: Partial<Contribution>): Contribution => ({
  id: "c",
  kind: "testimonial",
  contributorName: "Linh, her daughter",
  relationship: "daughter",
  title: "",
  body: "I remember the blue door too.",
  photos: [],
  memoryId: "m1",
  contributorEmail: "",
  personId: null,
  personIds: null,
  via: "web",
  status: "approved",
  createdAt: "2026-10-01T10:00:00Z",
  ...over,
});

describe("seenSides", () => {
  beforeEach(() => localStorage.clear());

  it("starts with nothing seen and remembers a count per memory", () => {
    expect(seenCount("m1")).toBe(0);
    markSeen("m1", 2);
    markSeen("m2", 1);
    expect(seenCount("m1")).toBe(2);
    expect(seenCount("m2")).toBe(1);
    expect(seenCount("m3")).toBe(0);
  });

  it("survives a broken stored value", () => {
    localStorage.setItem("astory.seenSides", "not json");
    expect(seenCount("m1")).toBe(0);
    markSeen("m1", 1);
    expect(seenCount("m1")).toBe(1);
  });

  it("counts only the sides past what was seen", () => {
    const sides = [side({ id: "a" }), side({ id: "b", createdAt: "2026-10-02T10:00:00Z" })];
    expect(newSides(sides, 0)).toHaveLength(2);
    expect(newSides(sides, 1).map((s) => s.id)).toEqual(["b"]);
    expect(newSides(sides, 5)).toHaveLength(0);
  });

  it("groups approved sides by memory, oldest first, and leaves the viewer's own out", () => {
    const rows = [
      side({ id: "b", createdAt: "2026-10-02T10:00:00Z" }),
      side({ id: "a" }),
      side({ id: "p", status: "pending" }),
      side({ id: "m", kind: "memory" }),
      side({ id: "x", memoryId: "m2", contributorName: "Bao", contributorEmail: "bao@example.com" }),
      side({ id: "y", memoryId: null }),
    ];
    const groups = groupSides(rows, { email: "BAO@example.com", firstName: "Bao" });
    expect([...groups.keys()]).toEqual(["m1"]);
    expect(groups.get("m1")!.map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("names who the new sides are from", () => {
    const sides = [side({ id: "a" }), side({ id: "b", contributorName: "Minh" }), side({ id: "c", contributorName: "Linh, her daughter" })];
    expect(newFromLine(sides, 3)).toBeNull();
    expect(newFromLine(sides, 2)).toBe("New from Linh");
    expect(newFromLine(sides, 0)).toBe("New from Linh and Minh");
    expect(newFromLine([...sides, side({ id: "d", contributorName: "An" })], 0)).toBe("New from Linh and 2 others");
  });
});
