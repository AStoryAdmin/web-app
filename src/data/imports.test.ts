// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: { table: string; rows: Record<string, unknown>[] }[] = [];
let upsertError: { message: string } | null = null;
vi.mock("../lib/supabase", () => ({
  supabase: () => ({
    from: (table: string) => ({
      upsert: async (rows: Record<string, unknown>[]) => {
        calls.push({ table, rows });
        return { error: upsertError };
      },
    }),
  }),
  getSupabase: () => null,
}));
vi.mock("../lib/analytics", () => ({ track: vi.fn() }));
const saved: { kind: string; id: string; storyId?: string }[] = [];
vi.mock("./memories", async (load) => ({
  ...(await load<typeof import("./memories")>()),
  saveStory: vi.fn(async (s: { id: string }) => void saved.push({ kind: "story", id: s.id })),
  saveMemoryRow: vi.fn(async (m: { id: string }, storyId: string) => void saved.push({ kind: "memory", id: m.id, storyId })),
}));
vi.mock("./familyWrites", async (orig) => ({ ...(await orig<typeof import("./familyWrites")>()), attachStory: vi.fn(async () => {}) }));
const linked: [string, string][] = [];
vi.mock("./session", () => ({ linkPersonStory: vi.fn(async (p: string, s: string) => (linked.push([p, s]), true)) }));

import {
  entriesToMemories,
  findAnchor,
  inTurn,
  planTreeImport,
  readImportFile,
  readPaste,
  readText,
  saveImportedMemories,
  saveTreeImport,
  unzipText,
  type ImportedTree,
} from "./imports";
import { parseGedcom } from "../app-core/lib/gedcom.js";
import type { Family, Person } from "./family";
import type { Story } from "./stories";

/** A zip with the given files, deflated (or stored), the way Word and WhatsApp write them. */
async function zip(files: Record<string, string>, store = false): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const deflate = async (raw: Uint8Array) =>
    new Uint8Array(await new Response(new Blob([raw as BlobPart]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer());
  const parts: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const raw = enc.encode(text);
    const data = store ? raw : await deflate(raw);
    const n = enc.encode(name);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(8, store ? 0 : 8, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, raw.length, true);
    local.setUint16(26, n.length, true);
    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true);
    central.setUint16(10, store ? 0 : 8, true);
    central.setUint32(20, data.length, true);
    central.setUint32(24, raw.length, true);
    central.setUint16(28, n.length, true);
    central.setUint32(42, offset, true);
    parts.push(new Uint8Array(local.buffer), n, data);
    centrals.push(new Uint8Array(central.buffer), n);
    offset += 30 + n.length + data.length;
  }
  const cdLength = centrals.reduce((t, c) => t + c.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, Object.keys(files).length, true);
  end.setUint16(10, Object.keys(files).length, true);
  end.setUint32(12, cdLength, true);
  end.setUint32(16, offset, true);
  return new Uint8Array(await new Blob([...parts, ...centrals, new Uint8Array(end.buffer)] as BlobPart[]).arrayBuffer());
}

const GED = `0 HEAD
1 SOUR Ancestry.com
1 GEDC
2 VERS 5.5.1
0 @I1@ INDI
1 NAME Rose /Nguyen/
1 SEX F
1 BIRT
2 DATE 12 MAR 1941
0 @I2@ INDI
1 NAME Bao /Nguyen/
1 SEX M
1 BIRT
2 DATE 1938
1 DEAT
2 DATE 1999
0 @I3@ INDI
1 NAME Linh /Nguyen/
1 SEX F
1 BIRT
2 DATE 1965
0 @F1@ FAM
1 HUSB @I2@
1 WIFE @I1@
1 CHIL @I3@
0 TRLR
`;

const story = { id: "s-rose", name: "Rose", lastName: "Nguyen", birthYear: "1941", memories: [] } as unknown as Story;

beforeEach(() => {
  calls.length = 0;
  saved.length = 0;
  linked.length = 0;
  upsertError = null;
});

describe("unzipText", () => {
  it("reads one file out of a deflated zip, and skips the rest", async () => {
    const bytes = await zip({ "media/IMG-1.jpg": "not words", "_chat.txt": "Hello, Hưng" });
    expect(await unzipText(bytes, (n) => n === "_chat.txt")).toBe("Hello, Hưng");
  });
  it("reads a stored entry, and answers null when nothing matches or it isn't a zip", async () => {
    expect(await unzipText(await zip({ "a.txt": "plain" }, true), (n) => n === "a.txt")).toBe("plain");
    expect(await unzipText(await zip({ "a.txt": "plain" }), (n) => n === "b.txt")).toBeNull();
    expect(await unzipText(new TextEncoder().encode("just text"), () => true)).toBeNull();
  });
});

describe("reading", () => {
  it("splits a paste into memories, with their years", () => {
    const r = readPaste("1962: We left Huế on the morning train with one suitcase.\n\n1975: The year the shop opened on Bolsa Avenue.", story);
    expect(r.kind).toBe("memories");
    if (r.kind !== "memories") return;
    expect(r.entries.map((e) => e.year)).toEqual([1962, 1975]);
    expect(r.entries.every((e) => e.include)).toBe(true);
  });

  it("says so when a paste is empty or holds nothing worth keeping", () => {
    expect(readPaste("   ", story).kind).toBe("nothing");
    expect(readPaste("hi", story).kind).toBe("nothing");
  });

  it("sends a family tree to the tree reader, whatever the file is called", () => {
    const r = readText(GED, "export.txt", story);
    expect(r.kind).toBe("tree");
    if (r.kind !== "tree") return;
    expect(r.tree.people).toHaveLength(3);
    expect(r.sourceName).toBe("Ancestry.com");
  });

  it("asks whose messages a group chat's memories are, starting with the storyteller's", () => {
    const chat = [
      "12/03/2019, 09:15 - Linh: Mum, tell me again about the train from Huế",
      "12/03/2019, 09:20 - Rose: We left before dawn with one suitcase and your uncle asleep on my lap",
      "12/03/2019, 09:22 - Linh: How old were you?",
    ].join("\n");
    const r = readText(chat, "WhatsApp Chat with Linh.txt", story);
    expect(r.kind).toBe("senders");
    if (r.kind !== "senders") return;
    expect(r.chosen).toEqual(["Rose"]);
    const chosen = readText(chat, "WhatsApp Chat with Linh.txt", story, ["Rose"]);
    expect(chosen.kind).toBe("memories");
    if (chosen.kind === "memories") expect(chosen.entries[0].body).toContain("one suitcase");
  });

  it("reads a Word file by chapter, marked as their memoir", async () => {
    const p = (text: string, style = "") =>
      `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ""}<w:r><w:t>${text}</w:t></w:r></w:p>`;
    const xml = `<w:document><w:body>${p("Leaving Huế", "Heading1")}${p("We left in 1962 on the morning train, the whole family in one carriage.")}${p("The shop", "Heading1")}${p("The shop opened in 1975 and smelled of star anise every morning.")}</w:body></w:document>`;
    const bytes = await zip({ "[Content_Types].xml": "<Types/>", "word/document.xml": xml });
    const file = new File([bytes as BlobPart], "Memoir.docx");
    const r = await readImportFile(file, story);
    expect(r.kind).toBe("memories");
    if (r.kind !== "memories") return;
    expect(r.sourceName).toBe("Rose's memoir");
    expect(r.entries.map((e) => e.title)).toEqual(["Leaving Huế", "The shop"]);
    expect(r.entries[0].source).toBe("memoir");
  });

  it("explains the files it can't read rather than guessing", async () => {
    for (const name of ["book.pdf", "old.doc", "page.jpg"]) {
      expect((await readImportFile(new File(["x"], name), story)).kind).toBe("nothing");
    }
    const notChat = new File([await zip({ "posts.json": "[]" }) as BlobPart], "facebook.zip");
    expect(await readImportFile(notChat, story)).toMatchObject({ kind: "nothing" });
  });

  it("reads a WhatsApp chat out of its .zip", async () => {
    const chat = "12/03/2019, 09:20 - Rose: We left before dawn with one suitcase and your uncle asleep on my lap";
    const file = new File([await zip({ "IMG-1.jpg": "x", "_chat.txt": chat }) as BlobPart], "WhatsApp Chat - Linh.zip");
    const r = await readImportFile(file, story);
    expect(r.kind).toBe("memories");
  });
});

describe("keeping memories", () => {
  it("makes only the ticked entries, shared, with the memoir's mark", () => {
    const made = entriesToMemories([
      { id: "a", title: " Leaving Huế ", body: "We left in 1962.", year: 1962, dateText: "1962", era: "Childhood", include: true, source: "memoir" },
      { id: "b", title: "", body: "Not this one.", year: null, dateText: "", era: "", include: false },
      { id: "c", title: "", body: "Undated words.", year: null, dateText: "", era: "", include: true },
    ]);
    expect(made).toHaveLength(2);
    expect(made[0]).toMatchObject({ title: "Leaving Huế", period: "1962", era: "Childhood", privacy: "shared", source: "memoir" });
    expect(made[1]).toMatchObject({ title: "Untitled memory", era: "Anything else" });
  });

  it("writes each memory's row into the story and counts them", async () => {
    const made = entriesToMemories(
      Array.from({ length: 6 }, (_, i) => ({ id: `e${i}`, title: `T${i}`, body: `Body ${i}`, year: null, dateText: "", era: "", include: true })),
    );
    const seen: number[] = [];
    await saveImportedMemories(made, "s-rose", (n) => seen.push(n));
    expect(saved.filter((s) => s.kind === "memory" && s.storyId === "s-rose")).toHaveLength(6);
    expect(seen.at(-1)).toBe(6);
  });

  it("takes nothing more once a save fails, and throws only when every lane has stopped", async () => {
    const wrote: number[] = [];
    let open = 0;
    const work = async (n: number) => {
      open++;
      await new Promise((r) => setTimeout(r, n === 2 ? 1 : 5));
      open--;
      if (n === 2) throw new Error("offline");
      wrote.push(n);
    };
    const seen: number[] = [];
    await expect(inTurn([1, 2, 3, 4, 5, 6], work, (_, n) => seen.push(n), 2)).rejects.toThrow("offline");
    // the other lane finishes the one it holds, then stops: the third is never written
    expect(open).toBe(0);
    expect(wrote).toEqual([1]);
    expect(seen).toEqual([1]);

    const one: number[] = [];
    await expect(inTurn([1, 2, 3], async (n) => { if (n === 2) throw new Error("no"); one.push(n); }, undefined, 1)).rejects.toThrow("no");
    expect(one).toEqual([1]);
  });
});

describe("keeping a tree", () => {
  const tree = parseGedcom(GED, { now: new Date("2026-10-27") }) as ImportedTree;
  let n = 0;
  const newId = () => `p${++n}`;
  beforeEach(() => {
    n = 0;
  });

  it("finds the storyteller in the tree by name, accents and case aside", () => {
    expect(findAnchor(tree, { name: "rose", lastName: "NGUYỄN".normalize("NFD").replace(/[̀-ͯ]/g, "") })).toBe("@I1@");
    expect(findAnchor(tree, { name: "Mai", lastName: "" })).toBeNull();
  });

  it("adds everyone, ties the storyteller to their story and marks the picked for one of their own", () => {
    const plan = planTreeImport(null, tree, { story, chosen: ["@I3@", "@I1@"], newId });
    expect(plan.people.map((p) => p.givenName)).toEqual(["Rose", "Bao", "Linh"]);
    expect(plan.edges).toHaveLength(3); // two parents of Linh, and a marriage
    expect(plan.anchor).toEqual({ personId: "p1", isNew: true });
    // Rose is the storyteller already, so only Linh gets a new story
    expect(plan.starts.map((s) => s.person.givenName)).toEqual(["Linh"]);
  });

  it("adds nobody twice when the same file comes in again", () => {
    const first = planTreeImport(null, tree, { newId });
    const family: Family = { people: first.people.map((p) => ({ ...p, householdId: "h1" })) as Person[], edges: first.edges, households: [] };
    family.people[0] = { ...family.people[0], storyId: "s-rose" } as Person;
    const again = planTreeImport(family, tree, { story, chosen: ["@I3@"], newId });
    expect(again.people).toEqual([]);
    expect(again.edges).toEqual([]);
    // the story is tied already, so nobody is re-tied; Linh is in the family and gets her story by link
    expect(again.anchor).toBeNull();
    expect(again.starts).toEqual([{ person: expect.objectContaining({ givenName: "Linh" }), isNew: false }]);
  });

  it("writes people, then relationships, then the new stories, each tied by link", async () => {
    const plan = planTreeImport(null, tree, { story, chosen: ["@I3@"], newId });
    const progress: number[] = [];
    const started = await saveTreeImport(plan, { userId: "u1", householdId: "h1", story }, (done) => progress.push(done));
    expect(started).toHaveLength(1);
    expect(started[0]).toMatchObject({ name: "Linh", lastName: "Nguyen", relationship: "Relative", birthYear: "1965", householdId: "h1" });
    const people = calls.find((c) => c.table === "people")!.rows;
    // the storyteller's story exists already, so their row carries it; Linh's is tied once it is made
    expect(people.find((r) => r.given_name === "Rose")).toMatchObject({ story_id: "s-rose", household_id: "h1", external_ref: "@I1@", source: "gedcom" });
    expect(people.find((r) => r.given_name === "Linh")!.story_id ?? null).toBeNull();
    expect(calls.find((c) => c.table === "relationships")!.rows).toHaveLength(3);
    expect(progress.at(-1)).toBe(3 + 3 + 1);
    const linh = plan.starts[0].person.id;
    expect(linked).toEqual([[linh, started[0].id]]);
  });

  it("starts no story when the people fail, so a retry makes none twice", async () => {
    const plan = planTreeImport(null, tree, { story, chosen: ["@I3@"], newId });
    upsertError = { message: "offline" };
    await expect(saveTreeImport(plan, { userId: "u1", householdId: "h1", story })).rejects.toBeTruthy();
    expect(saved.filter((s) => s.kind === "story")).toEqual([]);
    expect(linked).toEqual([]);
  });

  it("ties somebody already in the family through link_person_story", async () => {
    const first = planTreeImport(null, tree, { newId });
    const family: Family = { people: first.people as Person[], edges: first.edges, households: [] };
    const plan = planTreeImport(family, tree, { story: null, chosen: ["@I3@"], newId });
    const [made] = await saveTreeImport(plan, { userId: "u1", householdId: "h1", story: null });
    expect(linked).toEqual([["p3", made.id]]);
    expect(calls.filter((c) => c.table === "people")).toEqual([]);
  });
});
