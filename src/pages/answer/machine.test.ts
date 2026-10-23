import { describe, expect, it } from "vitest";
import { initialState, isEnd, reduce, type Event, type State, type Take } from "./machine";
import type { AnswerQuestion } from "../../lib/answerLink";

const q: AnswerQuestion = {
  askerName: "Sam",
  askerPhotoUrl: null,
  question: "What did your mother sing to you?",
  voiceUrl: "https://x/v.m4a",
  tellerName: "Rose",
  language: "en",
  answered: false,
  expired: false,
  tellerTitle: null,
  askerKin: null,
};
const take = (size = 10): Take => ({ blob: new Blob([new Uint8Array(size)], { type: "audio/webm" }), url: "blob:x", durationMs: 4200 });
const run = (s: State, ...events: Event[]) => events.reduce(reduce, s);
const ready = () => run(initialState, { type: "LOADED", result: { kind: "ready", q } });

describe("answer page machine", () => {
  it("loads into the question, or into each closed state", () => {
    expect(ready().phase).toBe("ask");
    expect(ready().q?.askerName).toBe("Sam");
    expect(run(initialState, { type: "LOADED", result: { kind: "expired", q } }).phase).toBe("expired");
    expect(run(initialState, { type: "LOADED", result: { kind: "answered", q: null } }).phase).toBe("answered");
    expect(run(initialState, { type: "LOADED", result: { kind: "notFound" } }).phase).toBe("notFound");
    expect(run(initialState, { type: "LOADED", result: { kind: "error", reason: "server" } }).phase).toBe("loadError");
  });

  it("a failed load says why, and can be tried again", () => {
    expect(run(initialState, { type: "LOADED", result: { kind: "error", reason: "network" } }).loadReason).toBe("network");
    expect(run(initialState, { type: "LOADED", result: { kind: "error", reason: "server" } }).loadReason).toBe("server");
    const s = run(initialState, { type: "LOADED", result: { kind: "error", reason: "server" } }, { type: "RETRY_LOAD" });
    expect(s.phase).toBe("loading");
    expect(run(s, { type: "LOADED", result: { kind: "ready", q } }).phase).toBe("ask");
  });

  it("says plainly what the permission prompt is the first time, and not again", () => {
    let s = run(ready(), { type: "RECORD" });
    expect(s.phase).toBe("micNote");
    s = run(s, { type: "MIC_GO" }, { type: "MIC_OK" });
    expect(s.phase).toBe("recording");
    s = run(s, { type: "STOPPED", take: take() }, { type: "REDO" }, { type: "REDO_YES" });
    expect(s.phase).toBe("starting");
    s = run(s, { type: "MIC_OK" }, { type: "STOPPED", take: take(0) });
    expect(s.phase).toBe("ask");
    expect(run(s, { type: "RECORD" }).phase).toBe("starting");
  });

  it("walks record → review → send → sent", () => {
    let s = run(ready(), { type: "RECORD" }, { type: "MIC_GO" }, { type: "MIC_OK" }, { type: "STOPPED", take: take() });
    expect(s.phase).toBe("review");
    expect(s.take?.durationMs).toBe(4200);
    s = run(s, { type: "SEND" });
    expect(s).toMatchObject({ phase: "sending", sending: "voice" });
    s = run(s, { type: "SENT", sentTo: "Sam" });
    expect(s).toMatchObject({ phase: "sent", sentTo: "Sam" });
    expect(isEnd(s.phase)).toBe(true);
  });

  it("'Say it again' asks first, and keeping it keeps the take", () => {
    const s = run(ready(), { type: "RECORD" }, { type: "MIC_GO" }, { type: "MIC_OK" }, { type: "STOPPED", take: take() }, { type: "REDO" });
    expect(s.phase).toBe("confirmRedo");
    expect(s.take).not.toBeNull();
    const kept = run(s, { type: "REDO_NO" });
    expect(kept.phase).toBe("review");
    expect(kept.take).toBe(s.take);
    expect(run(s, { type: "REDO_YES" }).take).toBeNull();
  });

  it("a refused or missing microphone opens the written answer", () => {
    const refused = run(ready(), { type: "RECORD" }, { type: "MIC_GO" }, { type: "MIC_REFUSED" });
    expect(refused).toMatchObject({ phase: "write", micRefused: true });
    const missing = run(ready(), { type: "NO_MIC" });
    expect(missing).toMatchObject({ phase: "write", micRefused: true });
  });

  it("the written answer sends only with words in it", () => {
    let s = run(ready(), { type: "WRITE" }, { type: "SEND" });
    expect(s.phase).toBe("write");
    s = run(s, { type: "TEXT", text: "   " }, { type: "SEND" });
    expect(s.phase).toBe("write");
    s = run(s, { type: "TEXT", text: "Ru con" }, { type: "SEND" });
    expect(s).toMatchObject({ phase: "sending", sending: "text" });
    expect(run(s, { type: "SENT", sentTo: null }).phase).toBe("sent");
  });

  it("a failed send keeps the answer and can be tried again", () => {
    let s = run(ready(), { type: "RECORD" }, { type: "MIC_GO" }, { type: "MIC_OK" }, { type: "STOPPED", take: take() }, { type: "SEND" }, { type: "SEND_FAILED" });
    expect(s.phase).toBe("sendFailed");
    expect(s.take).not.toBeNull();
    s = run(s, { type: "SEND" });
    expect(s).toMatchObject({ phase: "sending", sending: "voice" });
  });

  it("a question that closed while sending says so", () => {
    const s = run(ready(), { type: "WRITE" }, { type: "TEXT", text: "x" }, { type: "SEND" }, { type: "CLOSED", kind: "expired" });
    expect(s.phase).toBe("expired");
  });

  it("ignores events that do not belong to the current step", () => {
    const s = ready();
    for (const e of [{ type: "STOPPED", take: take() }, { type: "SEND" }, { type: "SENT", sentTo: "x" }, { type: "MIC_OK" }, { type: "REDO_YES" }] as Event[]) {
      expect(reduce(s, e)).toBe(s);
    }
    expect(reduce(initialState, { type: "RECORD" })).toBe(initialState);
  });
});
