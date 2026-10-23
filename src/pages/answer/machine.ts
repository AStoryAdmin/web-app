/**
 * The answer page as one state machine, pure so the tests can walk it.
 *
 *   loading → ask | expired | answered | notFound | loadError
 *   ask → micNote (first time) → starting → recording → review → sending → sent
 *   starting → write (microphone refused or missing)
 *   review → confirmRedo → starting (only after she says yes)
 *   sending → sendFailed (the take is kept) → sending
 *   sending → expired | answered (the question closed meanwhile)
 */
import type { AnswerQuestion, LoadResult } from "../../lib/answerLink";

export type Take = { blob: Blob; url: string; durationMs: number };

export type Phase =
  | "loading"
  | "loadError"
  | "notFound"
  | "expired"
  | "answered"
  | "ask"
  | "micNote"
  | "starting"
  | "recording"
  | "review"
  | "confirmRedo"
  | "write"
  | "sending"
  | "sendFailed"
  | "sent";

export type State = {
  phase: Phase;
  q: AnswerQuestion | null;
  take: Take | null;
  text: string;
  /** The plain line about the permission prompt has been shown once. */
  micNoted: boolean;
  /** Why the written answer is showing: the microphone was refused or is missing. */
  micRefused: boolean;
  /** What is being sent, for the "sent" line and for retrying. */
  sending: "voice" | "text" | null;
  sentTo: string | null;
  /** Why the load failed: no connection, or our side (rate limit, server). */
  loadReason: "network" | "server";
};

export type Event =
  | { type: "LOADED"; result: LoadResult }
  | { type: "RETRY_LOAD" }
  | { type: "RECORD" }
  | { type: "MIC_GO" }
  | { type: "MIC_OK" }
  | { type: "MIC_REFUSED" }
  | { type: "NO_MIC" }
  | { type: "STOPPED"; take: Take }
  | { type: "REDO" }
  | { type: "REDO_YES" }
  | { type: "REDO_NO" }
  | { type: "WRITE" }
  | { type: "TRY_MIC" }
  | { type: "TEXT"; text: string }
  | { type: "SEND" }
  | { type: "SENT"; sentTo: string | null }
  | { type: "SEND_FAILED" }
  | { type: "CLOSED"; kind: "expired" | "answered" };

export const initialState: State = {
  phase: "loading",
  q: null,
  take: null,
  text: "",
  micNoted: false,
  micRefused: false,
  sending: null,
  sentTo: null,
  loadReason: "network",
};

export function reduce(s: State, e: Event): State {
  switch (e.type) {
    case "LOADED": {
      if (s.phase !== "loading") return s;
      const r = e.result;
      if (r.kind === "ready") return { ...s, phase: "ask", q: r.q };
      if (r.kind === "expired" || r.kind === "answered") return { ...s, phase: r.kind, q: r.q };
      if (r.kind === "notFound") return { ...s, phase: "notFound" };
      return { ...s, phase: "loadError", loadReason: r.reason };
    }
    case "RETRY_LOAD":
      return s.phase === "loadError" ? { ...s, phase: "loading" } : s;
    case "RECORD":
      if (s.phase !== "ask") return s;
      return { ...s, phase: s.micNoted ? "starting" : "micNote", micNoted: true };
    case "MIC_GO":
      return s.phase === "micNote" ? { ...s, phase: "starting" } : s;
    case "MIC_OK":
      return s.phase === "starting" ? { ...s, phase: "recording" } : s;
    case "MIC_REFUSED":
      if (s.phase !== "starting" && s.phase !== "recording") return s;
      return { ...s, phase: "write", micRefused: true, take: null };
    case "NO_MIC":
      // this browser cannot record at all: the written answer is the door, said plainly
      return s.phase === "ask" ? { ...s, phase: "write", micRefused: true } : s;
    case "STOPPED":
      if (s.phase !== "recording") return s;
      // nothing came through (a tap and an immediate stop): back to the one button, nothing to send
      if (!e.take.blob.size) return { ...s, phase: "ask", take: null };
      return { ...s, phase: "review", take: e.take };
    case "REDO":
      return s.phase === "review" ? { ...s, phase: "confirmRedo" } : s;
    case "REDO_NO":
      return s.phase === "confirmRedo" ? { ...s, phase: "review" } : s;
    case "REDO_YES":
      return s.phase === "confirmRedo" ? { ...s, phase: "starting", take: null } : s;
    case "WRITE":
      return s.phase === "ask" ? { ...s, phase: "write", micRefused: false } : s;
    case "TRY_MIC":
      return s.phase === "write" ? { ...s, phase: "starting", micNoted: true } : s;
    case "TEXT":
      return s.phase === "write" || s.phase === "sendFailed" ? { ...s, text: e.text } : s;
    case "SEND": {
      if (s.phase === "review" && s.take) return { ...s, phase: "sending", sending: "voice" };
      if (s.phase === "write" && s.text.trim()) return { ...s, phase: "sending", sending: "text" };
      if (s.phase === "sendFailed" && s.sending) return { ...s, phase: "sending" };
      return s;
    }
    case "SENT":
      return s.phase === "sending" ? { ...s, phase: "sent", sentTo: e.sentTo } : s;
    case "SEND_FAILED":
      return s.phase === "sending" ? { ...s, phase: "sendFailed" } : s;
    case "CLOSED":
      return s.phase === "sending" ? { ...s, phase: e.kind } : s;
  }
}

/** The phases where the page is finished with the question and shows one message. */
export const isEnd = (p: Phase) => p === "expired" || p === "answered" || p === "notFound" || p === "sent";
