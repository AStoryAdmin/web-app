import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sb = vi.hoisted(() => ({ rpc: vi.fn(() => Promise.resolve({ data: { changed: true }, error: null })), userId: "u1" as string | null }));
vi.mock("../lib/supabase", () => ({
  getSupabase: () => ({
    rpc: sb.rpc,
    auth: { getSession: () => Promise.resolve({ data: { session: sb.userId ? { access_token: "t", user: { id: sb.userId } } : null } }) },
  }),
}));

// API_BASE is read once, when the module loads.
async function load(api = "https://ai.example.test") {
  vi.resetModules();
  vi.stubEnv("VITE_API_URL", api);
  return import("./ai");
}

const fetchMock = vi.fn();

beforeEach(() => {
  localStorage.clear();
  sb.rpc.mockClear();
  sb.userId = "u1";
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("AI consent", () => {
  it("asks once, remembers a yes under the phone's key, and doesn't ask again", async () => {
    const ai = await load();
    const ask = vi.fn(() => Promise.resolve(true));
    expect(await ai.ensureAiConsent("u1", ask)).toBe(true);
    expect(localStorage.getItem("astory-ai-consent:u1")).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(await ai.ensureAiConsent("u1", ask)).toBe(true);
    expect(ask).toHaveBeenCalledTimes(1);
  });

  it("keeps nothing for Not now, so the next use asks again", async () => {
    const ai = await load();
    expect(await ai.ensureAiConsent("u1", () => Promise.resolve(false))).toBe(false);
    expect(ai.hasAiConsent("u1")).toBe(false);
    expect(await ai.ensureAiConsent("u1", () => Promise.reject(new Error("closed")))).toBe(false);
  });

  it("is per account, and taking it back clears it", async () => {
    const ai = await load();
    ai.recordAiConsent("u1", true);
    expect(ai.hasAiConsent("u2")).toBe(false);
    ai.recordAiConsent("u1", false);
    expect(ai.hasAiConsent("u1")).toBe(false);
  });

  it("doesn't write to the server while it doesn't offer consent", async () => {
    const ai = await load();
    ai.recordAiConsent("u1", true);
    expect(sb.rpc).not.toHaveBeenCalled();
  });
});

describe("transcribe", () => {
  const blob = new Blob(["voice"], { type: "audio/webm;codecs=opus" });

  it("sends nothing until they have allowed it", async () => {
    const ai = await load();
    await expect(ai.transcribe(blob, "en")).rejects.toBeInstanceOf(ai.AiConsentNeeded);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the recording to /api/transcribe with the token and language, and returns the words", async () => {
    const ai = await load("https://ai.example.test/");
    ai.recordAiConsent("u1", true);
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ transcript: "  We had one bicycle.  " }), { status: 200 }));
    expect(await ai.transcribe(blob, "vi")).toBe("We had one bicycle.");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://ai.example.test/api/transcribe");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer t");
    const form = init.body as FormData;
    expect((form.get("audio") as File).name).toBe("recording.webm");
    expect(form.get("language")).toBe("vi");
  });

  it("names a Safari recording m4a and leaves the language out when unknown", async () => {
    const ai = await load();
    ai.recordAiConsent("u9", true);
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ transcript: "Hi" }), { status: 200 }));
    await ai.transcribe(new Blob(["x"], { type: "audio/mp4" }), "", { userId: "u9" });
    const form = (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as FormData;
    expect((form.get("audio") as File).name).toBe("recording.m4a");
    expect(form.has("language")).toBe(false);
  });

  it("throws the server's reason, and throws with no server set", async () => {
    let ai = await load();
    ai.recordAiConsent("u1", true);
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: "Too long" }), { status: 413 }));
    await expect(ai.transcribe(blob)).rejects.toThrow("Too long");
    ai = await load("");
    await expect(ai.transcribe(blob)).rejects.toThrow(/No AI server/);
  });
});
