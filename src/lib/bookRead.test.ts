import { describe, expect, it } from "vitest";
import { chapterSlug, classifyLoad, classifySample, inChapter, listenSrc, loadBook, parseReadQuery, parseRow, parseSampleMemory, resolveChapter, rpcBody, sampleUrl } from "./bookRead";

const S = "MAAAAAAAAAAAAAAAAAAAAQ"; // a story's short id (22 base64url characters)
const M1 = "QAAAAAAAAAAAAAAAAAAAEQ";
const KEY = "Ab3_dE-fGh1jKlM9";

const row = (over: Record<string, unknown> = {}) => ({
  memory_short: M1,
  title: "The Sunday pot roast",
  body: "Storyteller: Margaret never measured anything.\nInterviewer: How did she know?\nStoryteller: She knew by the smell.",
  era: "Childhood",
  period: "the 1960s",
  photo_url: "https://x/roast.jpg",
  has_voice: true,
  teller_name: "Rose",
  sides: [{ name: "Linh", body: "I remember the gravy." }],
  ...over,
});

describe("the codes the book prints", () => {
  it("slugs a chapter's name the way bookDesign.js does, and finds the chapter again", () => {
    expect(chapterSlug("Where we come from")).toBe("where-we-come-from");
    expect(chapterSlug("Love & family")).toBe("love-family");
    expect(chapterSlug("Faith & what carried me")).toBe("faith-what-carried-me");
    expect(resolveChapter("love-family")).toEqual({ kind: "era", era: "Love & family", name: "Love & family" });
    expect(resolveChapter("anything-else")).toEqual({ kind: "era", era: "Anything else", name: "More stories" });
    expect(resolveChapter("the-1960s")).toEqual({ kind: "decade", decade: 1960, name: "The 1960s" });
    expect(resolveChapter("other-memories")).toEqual({ kind: "undated", name: "Other memories" });
    expect(resolveChapter("from-the-family")).toBeNull();
    expect(resolveChapter("the-few-words")).toBeNull();
    expect(resolveChapter("")).toBeNull();
  });

  it("reads a chapter code, a memory code, and refuses the rest", () => {
    expect(parseReadQuery(`?s=${S}&c=childhood&k=${KEY}`)).toEqual({ kind: "chapter", story: S, chapter: { kind: "era", era: "Childhood", name: "Childhood" }, key: KEY });
    expect(parseReadQuery(`m=${M1}&k=${KEY}`)).toEqual({ kind: "memory", memory: M1, key: KEY });
    expect(parseReadQuery(`?s=${S}&c=childhood`)).toEqual({ kind: "invalid" });
    expect(parseReadQuery(`?s=${S}&c=childhood&k=short`)).toEqual({ kind: "invalid" });
    expect(parseReadQuery(`?s=${S}&c=from-the-family&k=${KEY}`)).toEqual({ kind: "invalid" });
    expect(parseReadQuery(`?s=nope&c=childhood&k=${KEY}`)).toEqual({ kind: "invalid" });
    expect(parseReadQuery(`?k=${KEY}`)).toEqual({ kind: "invalid" });
    expect(parseReadQuery(`?s=${S}&c=childhood&k=${KEY}&m=${M1}`).kind).toBe("memory");
    // the demo's plain ids still open
    expect(parseReadQuery(`?s=30000000-0000-0000-0000-000000000001&c=childhood&k=${KEY}`).kind).toBe("chapter");
  });

  it("asks the server for the chapter by name, the whole book for a decade, and one memory by its id", () => {
    expect(rpcBody({ kind: "chapter", story: S, chapter: { kind: "era", era: "Childhood", name: "Childhood" }, key: KEY })).toEqual({ p_story_short: S, p_key: KEY, p_chapter: "Childhood", p_memory_short: null });
    expect(rpcBody({ kind: "chapter", story: S, chapter: { kind: "decade", decade: 1960, name: "The 1960s" }, key: KEY })).toEqual({ p_story_short: S, p_key: KEY, p_chapter: null, p_memory_short: null });
    expect(rpcBody({ kind: "memory", memory: M1, key: KEY })).toEqual({ p_story_short: null, p_key: KEY, p_chapter: null, p_memory_short: M1 });
  });
});

describe("book_read's answer", () => {
  it("reads a row into a memory, with a transcript cleaned to her words and no labels", () => {
    const m = parseRow(row())!;
    expect(m.id).toBe(M1);
    expect(m.body).toBe("Margaret never measured anything.\n\nShe knew by the smell.");
    expect(m.body).not.toMatch(/Storyteller:|Interviewer:/);
    expect(m).toMatchObject({ title: "The Sunday pot roast", period: "the 1960s", era: "Childhood", photoUrl: "https://x/roast.jpg", hasVoice: true, tellerName: "Rose" });
    expect(m.sides).toEqual([{ name: "Linh", body: "I remember the gravy." }]);
    expect(parseRow(row({ body: "Plain prose, as she wrote it." }))!.body).toBe("Plain prose, as she wrote it.");
    expect(parseRow(row({ photo_url: null, has_voice: false, sides: null }))).toMatchObject({ photoUrl: null, hasVoice: false, sides: [] });
    expect(parseRow(row({ memory_short: "bad" }))).toBeNull();
    expect(parseRow(row({ title: "", body: "" }))).toBeNull();
    expect(parseRow(null)).toBeNull();
  });

  it("a chapter of three, in the book's order; nothing is not found", () => {
    const rows = [row({ memory_short: "QAAAAAAAAAAAAAAAAAAAIQ", title: "Later", period: "1971" }), row(), row({ memory_short: "QAAAAAAAAAAAAAAAAAAAMQ", title: "Undated", period: "" })];
    const r = classifyLoad(200, rows);
    expect(r.kind).toBe("shown");
    if (r.kind === "shown") expect(r.memories.map((m) => m.title)).toEqual(["The Sunday pot roast", "Later", "Undated"]);
    expect(classifyLoad(200, [])).toEqual({ kind: "notFound" });
    expect(classifyLoad(200, null)).toEqual({ kind: "notFound" });
  });

  it("a decade or the undated ones are picked out of the whole book here", () => {
    const sixties = parseRow(row())!;
    const seventies = parseRow(row({ memory_short: "QAAAAAAAAAAAAAAAAAAAIQ", title: "Later", period: "March 1974" }))!;
    const undated = parseRow(row({ memory_short: "QAAAAAAAAAAAAAAAAAAAMQ", title: "Undated", period: "" }))!;
    const all = [sixties, seventies, undated];
    expect(inChapter(all, { kind: "decade", decade: 1960, name: "The 1960s" })).toEqual([sixties]);
    expect(inChapter(all, { kind: "decade", decade: 1970, name: "The 1970s" })).toEqual([seventies]);
    expect(inChapter(all, { kind: "undated", name: "Other memories" })).toEqual([undated]);
    expect(inChapter(all, { kind: "era", era: "Childhood", name: "Childhood" })).toHaveLength(3);
    const r = classifyLoad(200, [row(), row({ memory_short: "QAAAAAAAAAAAAAAAAAAAIQ", period: "1974" })], { kind: "decade", decade: 1970, name: "The 1970s" });
    expect(r.kind === "shown" && r.memories.length).toBe(1);
    expect(classifyLoad(200, [row()], { kind: "decade", decade: 1980, name: "The 1980s" })).toEqual({ kind: "notFound" });
  });

  it("knows when the SQL is not on the server, and when the server is down", () => {
    expect(classifyLoad(404, { code: "PGRST202", message: "Could not find the function public.book_read" })).toEqual({ kind: "notReady" });
    expect(classifyLoad(400, { code: "P0001", message: "x" })).toEqual({ kind: "notFound" });
    expect(classifyLoad(500, {})).toEqual({ kind: "error", reason: "server" });
    expect(classifyLoad(429, {})).toEqual({ kind: "error", reason: "server" });
  });

  it("calls the rpc with the anon key and the code's parts; a code it cannot read never calls", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const doFetch = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify([row()]), { status: 200 });
    }) as unknown as typeof fetch;
    const q = parseReadQuery(`?s=${S}&c=childhood&k=${KEY}`);
    const r = await loadBook(q, { endpoint: "https://t.supabase.co/rest/v1/rpc/book_read", anonKey: "anon", fetch: doFetch });
    expect(r.kind).toBe("shown");
    expect(calls[0].url).toBe("https://t.supabase.co/rest/v1/rpc/book_read");
    expect(calls[0].init.body).toBe(JSON.stringify({ p_story_short: S, p_key: KEY, p_chapter: "Childhood", p_memory_short: null }));
    expect((calls[0].init.headers as Record<string, string>).apikey).toBe("anon");
    expect(await loadBook({ kind: "invalid" }, { fetch: doFetch })).toEqual({ kind: "notFound" });
    expect(calls).toHaveLength(1);
    const offline = (async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;
    expect(await loadBook(q, { endpoint: "https://t/x", fetch: offline })).toEqual({ kind: "error", reason: "network" });
  });

  it("plays the voice through the listen function with the memory and the book's key, as the book prints it", () => {
    expect(listenSrc(M1, KEY, "https://t.supabase.co/")).toBe(`https://t.supabase.co/functions/v1/listen?m=${M1}&k=${KEY}`);
    expect(listenSrc("bad", KEY, "https://t.supabase.co")).toBe("");
    expect(listenSrc(M1, "", "https://t.supabase.co")).toBe("");
    expect(listenSrc(M1, KEY, "")).toBe("");
  });
});

describe("a sample book's code (the site's fictional families)", () => {
  const file = {
    book: "carolyn",
    teller: "Carolyn",
    chapters: [
      {
        slug: "love-family",
        name: "Love & family",
        memories: [
          {
            id: "m3",
            title: "The wedding, in the rain",
            period: "June 1982 · aged 22",
            body: "It rained. Oh, it rained.\n\nVows are words.",
            photo: "https://astoryapp.com/mission/30-1200.webp",
            audio: "/read-samples/audio/carolyn-m3.mp3",
            sides: [{ name: "Rick Bennett, her husband", body: "It wasn’t the whole dinner." }],
          },
          { id: "m5", title: "Tunnel Park", period: "Summer 1986", body: "The beach one.", photo: "/read-samples/img/beach.jpg", audio: "https://evil.example/x.mp3", sides: [] },
        ],
      },
    ],
  };

  it("reads ?sample=<book>&c=<slug> with no key, and refuses a slug chapterSlug would not print", () => {
    expect(parseReadQuery("?sample=carolyn&c=love-family")).toEqual({ kind: "sample", book: "carolyn", slug: "love-family" });
    expect(parseReadQuery("sample=tom&c=the-world-we-lived-through").kind).toBe("sample");
    expect(parseReadQuery("?sample=carolyn&c=Love%20%26%20family")).toEqual({ kind: "invalid" });
    expect(parseReadQuery("?sample=carolyn")).toEqual({ kind: "invalid" });
    expect(parseReadQuery("?sample=../etc&c=childhood")).toEqual({ kind: "invalid" });
    expect(parseReadQuery("?sample=&c=childhood")).toEqual({ kind: "invalid" });
    // a real code is read as before, and a real code never turns into a sample
    expect(parseReadQuery(`?s=${S}&c=childhood&k=${KEY}`).kind).toBe("chapter");
  });

  it("keeps the slugs the book prints: every chapter name slugs the same as the phone app's", () => {
    for (const [name, slug] of [
      ["Where we come from", "where-we-come-from"],
      ["Work & making a living", "work-making-a-living"],
      ["The world we lived through", "the-world-we-lived-through"],
    ])
      expect(parseReadQuery(`?sample=raymond&c=${chapterSlug(name)}`)).toEqual({ kind: "sample", book: "raymond", slug });
  });

  it("shows one chapter of the file in the book's order, its words whole, its clip and photo only from its own files", () => {
    const r = classifySample(200, file, "love-family");
    expect(r.kind).toBe("shown");
    if (r.kind !== "shown") return;
    expect(r.memories.map((m) => m.title)).toEqual(["The wedding, in the rain", "Tunnel Park"]);
    expect(r.memories[0]).toMatchObject({
      era: "Love & family",
      period: "June 1982 · aged 22",
      body: "It rained. Oh, it rained.\n\nVows are words.",
      photoUrl: "https://astoryapp.com/mission/30-1200.webp",
      hasVoice: true,
      voiceSrc: "/read-samples/audio/carolyn-m3.mp3",
      tellerName: "Carolyn",
      sides: [{ name: "Rick Bennett, her husband", body: "It wasn’t the whole dinner." }],
    });
    expect(r.memories[1]).toMatchObject({ photoUrl: "/read-samples/img/beach.jpg", hasVoice: false });
    expect(r.memories[1].voiceSrc).toBeUndefined();
    expect(classifySample(200, file, "childhood")).toEqual({ kind: "notFound" });
    expect(classifySample(200, "<!doctype html>", "love-family")).toEqual({ kind: "notFound" });
    expect(classifySample(404, null, "love-family")).toEqual({ kind: "notFound" });
    expect(classifySample(503, null, "love-family")).toEqual({ kind: "error", reason: "server" });
    expect(parseSampleMemory({ id: "", title: "x" }, "C", "T")).toBeNull();
  });

  it("loads the bundled file, never Supabase", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const doFetch = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify(file), { status: 200 });
    }) as unknown as typeof fetch;
    const r = await loadBook(parseReadQuery("?sample=carolyn&c=love-family"), { sampleBase: "/", endpoint: "https://t.supabase.co/rest/v1/rpc/book_read", fetch: doFetch });
    expect(r.kind).toBe("shown");
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("/read-samples/carolyn.json");
    expect(calls[0].init.method).toBe("GET");
    expect(sampleUrl("tom", "/app/")).toBe("/app/read-samples/tom.json");
    const offline = (async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;
    expect(await loadBook(parseReadQuery("?sample=carolyn&c=love-family"), { fetch: offline })).toEqual({ kind: "error", reason: "network" });
  });
});
