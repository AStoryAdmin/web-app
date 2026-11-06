import { describe, expect, it } from "vitest";
import { closedLine, initialState, isEnd, lengthWords, reduce, type Event, type State } from "./machine";
import { classifyLoad, cleanToken, listenSrc, loadMemory, parseMemory, type LinkedMemory } from "../../lib/memoryLink";

const memory: LinkedMemory = {
  title: "The Sunday pot roast",
  period: "the 1960s",
  body: "Margaret never measured anything.",
  photoUrl: "https://x/roast.jpg",
  tellerName: "Rose",
  senderName: "Daniel",
  forName: "Dad",
  hasVoice: true,
  audioSeconds: 94,
};
const run = (s: State, ...events: Event[]) => events.reduce(reduce, s);

describe("memory link page machine", () => {
  it("starts loading, and lands in shown with the memory and its sender", () => {
    expect(initialState.phase).toBe("loading");
    const s = run(initialState, { type: "LOADED", result: { kind: "shown", memory } });
    expect(s.phase).toBe("shown");
    expect(s.memory?.title).toBe("The Sunday pot roast");
    expect(s.senderName).toBe("Daniel");
    expect(isEnd(s.phase)).toBe(false);
  });

  it("a link opened before shows only that, with the sender's name kept", () => {
    const s = run(initialState, { type: "LOADED", result: { kind: "opened", senderName: "Daniel" } });
    expect(s.phase).toBe("opened");
    expect(s.memory).toBeNull();
    expect(s.senderName).toBe("Daniel");
    expect(isEnd(s.phase)).toBe(true);
  });

  it("not found and not ready are end states", () => {
    expect(run(initialState, { type: "LOADED", result: { kind: "notFound" } }).phase).toBe("notFound");
    expect(run(initialState, { type: "LOADED", result: { kind: "notReady" } }).phase).toBe("notReady");
    expect(isEnd("notFound")).toBe(true);
    expect(isEnd("notReady")).toBe(true);
  });

  it("a failed load says why and can be tried again; a late answer changes nothing", () => {
    const failed = run(initialState, { type: "LOADED", result: { kind: "error", reason: "server" } });
    expect(failed.phase).toBe("loadError");
    expect(failed.loadReason).toBe("server");
    const again = run(failed, { type: "RETRY_LOAD" });
    expect(again.phase).toBe("loading");
    expect(run(again, { type: "LOADED", result: { kind: "shown", memory } }).phase).toBe("shown");
    const shown = run(initialState, { type: "LOADED", result: { kind: "shown", memory } });
    expect(run(shown, { type: "LOADED", result: { kind: "opened", senderName: "X" } })).toBe(shown);
    expect(run(shown, { type: "RETRY_LOAD" })).toBe(shown);
  });

  it("names the sender when asking for a new link, by first name, without an em-dash", () => {
    expect(closedLine("Daniel Nguyen")).toBe("Ask Daniel to send a new one.");
    expect(closedLine("")).toBe("Ask the person who sent it to send a new one.");
    expect(closedLine("The family")).toBe("Ask the person who sent it to send a new one.");
    expect(closedLine("Daniel")).not.toContain("—");
  });

  it("says how long the voice is, in minutes and seconds", () => {
    expect(lengthWords(94)).toBe("1 min 34 s");
    expect(lengthWords(120)).toBe("2 min");
    expect(lengthWords(8)).toBe("8 s");
    expect(lengthWords(null)).toBe("");
    expect(lengthWords(0)).toBe("");
  });
});

describe("memory_link_read's answer", () => {
  const row = {
    story_id: "s", memory_id: "m", title: "The Sunday pot roast", period: "the 1960s", body: "Margaret never measured anything.",
    photo_url: "https://x/roast.jpg", teller_name: "Rose", teller_last_name: "Bennett", sender_name: "Daniel", sender_id: "u",
    for_name: "Dad", has_voice: true, audio_seconds: 94, opened: false, read_at: "2026-11-06T10:00:00Z",
  };

  it("reads one row into the memory the page shows", () => {
    expect(parseMemory(row)).toEqual(memory);
    expect(classifyLoad(200, [row])).toEqual({ kind: "shown", memory });
    expect(parseMemory({ ...row, has_voice: false, audio_seconds: null })).toMatchObject({ hasVoice: false, audioSeconds: null });
  });

  it("an opened link is its own answer, and an empty one is not found", () => {
    expect(classifyLoad(200, [{ opened: true, sender_name: "Daniel" }])).toEqual({ kind: "opened", senderName: "Daniel" });
    expect(classifyLoad(200, [])).toEqual({ kind: "notFound" });
    expect(classifyLoad(200, null)).toEqual({ kind: "notFound" });
    expect(classifyLoad(200, [{ title: "", body: "", photo_url: null }])).toEqual({ kind: "notFound" });
  });

  it("knows when the SQL is not on the server, and when the server is down", () => {
    expect(classifyLoad(404, { code: "PGRST202", message: "Could not find the function public.memory_link_read" })).toEqual({ kind: "notReady" });
    expect(classifyLoad(400, { code: "P0001", message: "x" })).toEqual({ kind: "notFound" });
    expect(classifyLoad(500, {})).toEqual({ kind: "error", reason: "server" });
    expect(classifyLoad(429, {})).toEqual({ kind: "error", reason: "server" });
  });

  it("calls the rpc with the anon key and the cleaned token", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const doFetch = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify([row]), { status: 200 });
    }) as unknown as typeof fetch;
    const r = await loadMemory("k7px2qhm4d", { endpoint: "https://t.supabase.co/rest/v1/rpc/memory_link_read", anonKey: "anon", fetch: doFetch });
    expect(r.kind).toBe("shown");
    expect(calls[0].url).toBe("https://t.supabase.co/rest/v1/rpc/memory_link_read");
    expect(calls[0].init.body).toBe(JSON.stringify({ p_token: "K7PX2QHM4D" }));
    expect((calls[0].init.headers as Record<string, string>).apikey).toBe("anon");
    expect(await loadMemory("short", { fetch: doFetch })).toEqual({ kind: "notFound" });
    const offline = (async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;
    expect(await loadMemory("K7PX2QHM4D", { endpoint: "https://t/x", fetch: offline })).toEqual({ kind: "error", reason: "network" });
  });

  it("plays the voice through the listen function, keyed by the link", () => {
    expect(cleanToken(" k7px-2qhm4d ")).toBe("K7PX2QHM4D");
    expect(cleanToken("RS4HNT")).toBe("");
    expect(listenSrc("k7px2qhm4d", "https://t.supabase.co/")).toBe("https://t.supabase.co/functions/v1/listen?t=K7PX2QHM4D");
    expect(listenSrc("bad", "https://t.supabase.co")).toBe("");
    expect(listenSrc("K7PX2QHM4D", "")).toBe("");
  });
});
