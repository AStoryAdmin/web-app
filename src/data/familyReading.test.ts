// A story read as family: family_story_read()'s answer, as the pages' read-only Story.
import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/supabase", () => ({ supabase: () => ({}) }));

import { storyFromFamilyRead } from "./familyReading";

describe("storyFromFamilyRead", () => {
  it("is read-only, somebody else's, with its kept sides, and photos only when the function sends them", () => {
    const s = storyFromFamilyRead(
      {
        id: "b",
        name: "Bao",
        last_name: "Vo",
        memories: [
          { id: "m2", title: "Later", body: "b", era: "Life", created_at: "2026-02-01T00:00:00Z", sides: [] },
          {
            id: "m1",
            title: "Grandpa",
            body: "a",
            era: "Life",
            created_at: "2026-01-01T00:00:00Z",
            photos: [{ public_url: "https://x/storage/v1/object/public/memory-photos/b/m1/p.jpg", storage_path: "b/m1/p.jpg", sort_order: 0 }],
            sides: [{ body: "I remember the uniform", contributor_name: "GBao", relationship: "", created_at: "2026-10-18T00:00:00Z" }],
          },
        ],
      },
      "h",
      "bao",
    )!;
    expect(s.readOnly).toBe(true);
    expect(s.ownerId).toBe("bao");
    expect(s.householdId).toBe("h");
    expect(s.memories.map((m) => m.id)).toEqual(["m1", "m2"]);
    expect(s.memories[0].photos).toEqual(["https://x/storage/v1/object/public/memory-photos/b/m1/p.jpg"]);
    expect(s.memories[0].familySides?.[0]).toMatchObject({ body: "I remember the uniform", contributorName: "GBao" });
    expect(s.memories[1].photos).toEqual([]);
    expect(s.memories.every((m) => m.privacy === "shared" && m.status === "saved")).toBe(true);
  });
  it("is nothing for a story outside the family", () => {
    expect(storyFromFamilyRead(null, "h")).toBeNull();
  });
});
