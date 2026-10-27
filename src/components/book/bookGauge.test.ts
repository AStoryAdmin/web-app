import { describe, expect, it } from "vitest";
import { bookGauge, COUNTDOWN } from "./bookGauge";
import { newMemory, newStory } from "../../data/memories";

function storyWith(n: number) {
  const s = newStory({ id: "s1", name: "Nora", lastName: "Whitfield", relationship: "Grandmother", birthYear: "1941" });
  s.memories = Array.from({ length: n }, (_, i) =>
    newMemory({ id: `m${i}`, title: `Memory ${i}`, era: "Childhood", period: "1950", body: "Words.", createdAt: "2026-09-01T10:00:00.000Z" }),
  );
  return s;
}

describe("the way to a first edition", () => {
  it("never counts down, from an empty book to a full one", () => {
    for (const n of [0, 1, 2, 12, 19, 20, 25]) {
      const g = bookGauge(storyWith(n));
      expect(g.headline).not.toMatch(COUNTDOWN);
      expect(g.label).not.toMatch(COUNTDOWN);
      expect(g.headline).not.toMatch(/\bdays?\b/i);
    }
  });
  it("says what is there and how full the rule is", () => {
    const g = bookGauge(storyWith(5));
    expect(g.headline).toBe("5 memories so far");
    expect(g.pct).toBe(25);
    expect(g.label).toBe("25% of the way to a first edition");
    expect(bookGauge(storyWith(1)).headline).toBe("1 memory so far");
  });
  it("fills the rule and stops there once there is enough", () => {
    expect(bookGauge(storyWith(30)).pct).toBe(100);
  });
});
