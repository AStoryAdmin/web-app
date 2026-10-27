import { describe, expect, it } from "vitest";
import { holdsUnsaved, initialState, reduce, type Event, type State, type Take } from "./machine";
import type { Clip } from "../../data/stories";

const take = (size = 10): Take => ({ blob: new Blob([new Uint8Array(size)], { type: "audio/mp4" }), url: "blob:x", durationMs: 4200 });
const clip: Clip = { id: "voice-m1", bucket: "memory-audio", path: "s1/m1/voice.m4a", speaker: "Sam", duration: 4, transcript: "" };
const run = (s: State, ...events: Event[]) => events.reduce(reduce, s);
const recording = (ai: boolean | null = true) => run(initialState("m1", ai), { type: "RECORD" }, ...(ai === null ? [{ type: "CONSENT", allow: true } as Event] : []), { type: "MIC_OK" });
const review = (ai: boolean | null = true) => run(recording(ai), { type: "STOPPED", take: take() });

describe("record page machine", () => {
  it("asks for AI consent the first time, then records either way", () => {
    const asked = run(initialState("m1"), { type: "RECORD" });
    expect(asked.phase).toBe("consent");
    const yes = run(asked, { type: "CONSENT", allow: true });
    expect(yes).toMatchObject({ phase: "starting", ai: true });
    const no = run(asked, { type: "CONSENT", allow: false });
    expect(no).toMatchObject({ phase: "starting", ai: false });
  });

  it("goes straight to the microphone once consent is answered", () => {
    expect(run(initialState("m1", true), { type: "RECORD" }).phase).toBe("starting");
    expect(run(initialState("m1", false), { type: "RECORD" }).phase).toBe("starting");
  });

  it("records, stops into review, and an empty take goes back to the button", () => {
    expect(recording().phase).toBe("recording");
    expect(review().phase).toBe("review");
    expect(review().take?.durationMs).toBe(4200);
    const empty = run(recording(), { type: "STOPPED", take: take(0) });
    expect(empty).toMatchObject({ phase: "ready", take: null });
  });

  it("falls back to writing when the microphone is refused or missing", () => {
    const refused = run(initialState("m1", true), { type: "RECORD" }, { type: "MIC_REFUSED" });
    expect(refused).toMatchObject({ phase: "noMic", micRefused: true });
    expect(run(refused, { type: "TRY_MIC" }).phase).toBe("starting");
    const missing = run(initialState("m1"), { type: "NO_MIC" });
    expect(missing).toMatchObject({ phase: "noMic", micRefused: false });
    // trying again before consent was ever answered asks first
    expect(run(missing, { type: "TRY_MIC" }).phase).toBe("consent");
  });

  it("asks before 'Say it again' records over the take", () => {
    const asked = run(review(), { type: "REDO" });
    expect(asked.phase).toBe("confirmRedo");
    expect(run(asked, { type: "REDO_NO" })).toMatchObject({ phase: "review" });
    expect(run(asked, { type: "REDO_NO" }).take).not.toBeNull();
    expect(run(asked, { type: "REDO_YES" })).toMatchObject({ phase: "starting", take: null });
  });

  it("keeps: uploads, shows the words, saves", () => {
    const up = run(review(), { type: "KEEP" });
    expect(up.phase).toBe("uploading");
    const words = run(up, { type: "UPLOADED", clip, words: "  We lived by the sea.  " });
    expect(words).toMatchObject({ phase: "words", words: "We lived by the sea.", wordsFrom: "transcript", clip });
    const edited = run(words, { type: "TEXT", text: "We lived by the sea, in Hue." });
    expect(edited.words).toBe("We lived by the sea, in Hue.");
    const saving = run(edited, { type: "SAVE" });
    expect(saving.phase).toBe("saving");
    expect(run(saving, { type: "SAVED" }).phase).toBe("kept");
  });

  it("says why there are no words: AI off, or they didn't come through", () => {
    expect(run(review(false), { type: "KEEP" }, { type: "UPLOADED", clip, words: null }).wordsFrom).toBe("off");
    expect(run(review(true), { type: "KEEP" }, { type: "UPLOADED", clip, words: null }).wordsFrom).toBe("missing");
    expect(run(review(true), { type: "KEEP" }, { type: "UPLOADED", clip, words: "   " }).wordsFrom).toBe("missing");
  });

  it("keeps the take through a failed upload, and the words through a failed save", () => {
    const failed = run(review(), { type: "KEEP" }, { type: "UPLOAD_FAILED" });
    expect(failed.phase).toBe("uploadFailed");
    expect(failed.take).not.toBeNull();
    expect(run(failed, { type: "KEEP" }).phase).toBe("uploading");

    const saveFailed = run(review(), { type: "KEEP" }, { type: "UPLOADED", clip, words: "Hello" }, { type: "SAVE" }, { type: "SAVE_FAILED" });
    expect(saveFailed).toMatchObject({ phase: "saveFailed", words: "Hello", clip });
    expect(run(saveFailed, { type: "SAVE" }).phase).toBe("saving");
  });

  it("keeps one memory id from start to finish", () => {
    const s = run(review(), { type: "KEEP" }, { type: "UPLOAD_FAILED" }, { type: "KEEP" }, { type: "UPLOADED", clip, words: "x" }, { type: "SAVE" }, { type: "SAVED" });
    expect(s.memoryId).toBe("m1");
  });

  it("ignores events out of turn", () => {
    const ready = initialState("m1", true);
    expect(run(ready, { type: "KEEP" })).toBe(ready);
    expect(run(ready, { type: "SAVE" })).toBe(ready);
    expect(run(ready, { type: "STOPPED", take: take() })).toBe(ready);
    const r = review();
    expect(run(r, { type: "UPLOADED", clip, words: "x" })).toBe(r);
    expect(run(r, { type: "TEXT", text: "x" })).toBe(r);
  });

  it("knows when leaving would lose a recording", () => {
    expect(holdsUnsaved("ready")).toBe(false);
    expect(holdsUnsaved("noMic")).toBe(false);
    expect(holdsUnsaved("kept")).toBe(false);
    expect(holdsUnsaved("recording")).toBe(true);
    expect(holdsUnsaved("review")).toBe(true);
    expect(holdsUnsaved("words")).toBe(true);
    expect(holdsUnsaved("saveFailed")).toBe(true);
  });
});
