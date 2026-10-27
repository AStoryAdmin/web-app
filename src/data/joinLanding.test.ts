// After a family code: the story Home opens on, and the line that says so (no story of the joiner's own).
import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/supabase", () => ({ supabase: () => ({}) }));

import { joinedLine, joinedStoryId } from "./joinLanding";

describe("joinedStoryId", () => {
  it("is the story the code named, once the account can open it", () => {
    expect(joinedStoryId({ ok: true, story_id: "s" }, [{ id: "s" }])).toBe("s");
    expect(joinedStoryId({ ok: true, story_id: "s" }, [{ id: "t" }])).toBeNull();
    expect(joinedStoryId({ ok: true }, [{ id: "s" }])).toBeNull();
    expect(joinedStoryId({ ok: false, reason: "expired" }, [{ id: "s" }])).toBeNull();
    expect(joinedStoryId(null, [])).toBeNull();
  });
});

describe("joinedLine", () => {
  it("points at Home and promises no story of their own", () => {
    const line = joinedLine({ ok: true, inviter_name: "Bao", story_name: "Rose" });
    expect(line).toBe("Welcome to Bao’s family. Rose’s story is on your Home.");
    expect(line).not.toMatch(/your own story/);
  });
  it("says when nothing has been shared yet", () => {
    expect(joinedLine({ ok: true }, false)).toMatch(/^Welcome to the family\. Nobody has shared a story with you yet\./);
  });
  it("says only where the stories are when they were in already", () => {
    expect(joinedLine({ ok: true, already: true })).toBe("Your family’s stories are on your Home.");
  });
  it("mentions a tree that came with them", () => {
    expect(joinedLine({ ok: true, moved: true })).toMatch(/Everyone you had added/);
  });
});
