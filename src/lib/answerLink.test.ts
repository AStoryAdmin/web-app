import { describe, expect, it } from "vitest";
import { classifyLoad, loadQuestion, plainMime, sendText, sendVoice, SendError } from "./answerLink";

const payload = {
  ok: true,
  askerName: "Sam",
  askerPhotoUrl: null,
  question: "What did your mother sing to you?",
  voiceUrl: null,
  tellerName: "Rose",
  language: "vi",
  answered: false,
  expired: false,
};
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const opts = (impl: (url: string, init?: RequestInit) => Promise<Response>, calls: { url: string; init?: RequestInit }[] = []) => ({
  endpoint: "https://p.supabase.co/functions/v1/answer-link",
  anonKey: "anon",
  fetch: (async (u: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(u), init });
    return impl(String(u), init);
  }) as typeof fetch,
});

describe("answerLink", () => {
  it("classifies what the server says", () => {
    expect(classifyLoad(200, payload).kind).toBe("ready");
    expect(classifyLoad(200, { ...payload, expired: true }).kind).toBe("expired");
    expect(classifyLoad(410, { ok: false, expired: true }).kind).toBe("expired");
    expect(classifyLoad(200, { ...payload, answered: true }).kind).toBe("answered");
    expect(classifyLoad(404, { ok: false }).kind).toBe("notFound");
    expect(classifyLoad(200, { ok: false }).kind).toBe("notFound");
    expect(classifyLoad(500, null)).toEqual({ kind: "error", reason: "server" });
    expect(classifyLoad(429, { ok: false, error: "rate_limited" })).toEqual({ kind: "error", reason: "server" });
    expect(classifyLoad(500, { ok: false, error: "server" })).toEqual({ kind: "error", reason: "server" });
    expect(classifyLoad(200, null).kind).toBe("error");
    // lane S error shapes
    expect(classifyLoad(410, { ok: false, error: "expired" }).kind).toBe("expired");
    expect(classifyLoad(409, { ok: false, error: "answered" }).kind).toBe("answered");
    expect(classifyLoad(404, { ok: false, error: "not_found" }).kind).toBe("notFound");
    expect(classifyLoad(400, { ok: false, error: "bad_request" }).kind).toBe("notFound");
    expect(classifyLoad(200, { ...payload, expired: true, voiceUrl: null }).kind).toBe("expired");
  });

  it("GETs the token with the anon key, and turns a dropped connection into an error", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const r = await loadQuestion("tok_123456", opts(async () => json(200, payload), calls));
    expect(r.kind).toBe("ready");
    expect(calls[0].url).toBe("https://p.supabase.co/functions/v1/answer-link?t=tok_123456");
    expect((calls[0].init?.headers as Record<string, string>).apikey).toBe("anon");
    expect((calls[0].init?.headers as Record<string, string>).Authorization).toBe("Bearer anon");
    expect(await loadQuestion("tok_123456", opts(async () => Promise.reject(new TypeError("offline"))))).toEqual({ kind: "error", reason: "network" });
    expect((await loadQuestion("../bad token", opts(async () => json(200, payload)))).kind).toBe("notFound");
  });

  it("sends a recording in three steps", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const o = opts(async (url, init) => {
      if (url.startsWith("https://storage")) return new Response("{}", { status: 200 });
      const b = JSON.parse(String(init?.body));
      if (b.step === "upload") return json(200, { ok: true, uploadUrl: "https://storage/up?token=x", path: "answers/a.webm", token: "x", contentType: "audio/webm" });
      return json(200, { ok: true, sentTo: "Sam" });
    }, calls);
    const blob = new Blob([new Uint8Array(32)], { type: "audio/webm;codecs=opus" });
    expect(await sendVoice("tok_123456", blob, 4321.6, o)).toEqual({ sentTo: "Sam" });
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({ t: "tok_123456", step: "upload", mime: "audio/webm", size: 32 });
    expect(calls[1]).toMatchObject({ url: "https://storage/up?token=x", init: { method: "PUT" } });
    expect(calls[1].init?.body).toBe(blob);
    expect((calls[1].init?.headers as Record<string, string>)["Content-Type"]).toBe("audio/webm");
    expect(JSON.parse(String(calls[2].init?.body))).toEqual({ t: "tok_123456", step: "done", path: "answers/a.webm", durationMs: 4322 });
  });

  it("sends a written answer, trimmed", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    await sendText("tok_123456", "  Ru con  ", opts(async () => json(200, { ok: true, sentTo: "Sam" }), calls));
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({ t: "tok_123456", step: "done", text: "Ru con" });
  });

  it("says why a send failed", async () => {
    const blob = new Blob([new Uint8Array(4)], { type: "audio/mp4" });
    const closed = sendVoice("tok_123456", blob, 1, opts(async () => json(410, { ok: false, error: "expired" })));
    await expect(closed).rejects.toMatchObject({ kind: "expired" });
    const done = sendText("tok_123456", "x", opts(async () => json(409, { ok: false, error: "answered" })));
    await expect(done).rejects.toMatchObject({ kind: "answered" });
    const putFails = sendVoice(
      "tok_123456",
      blob,
      1,
      opts(async (url) => (url.startsWith("https://storage") ? new Response("", { status: 500 }) : json(200, { uploadUrl: "https://storage/u", path: "p" }))),
    );
    await expect(putFails).rejects.toBeInstanceOf(SendError);
    await expect(putFails).rejects.toMatchObject({ kind: "failed" });
  });

  it("plain mime", () => {
    expect(plainMime("audio/webm;codecs=opus")).toBe("audio/webm");
    expect(plainMime("audio/mp4")).toBe("audio/mp4");
    expect(plainMime("")).toBe("audio/webm");
    expect(plainMime("text/html")).toBe("audio/webm");
  });
});
