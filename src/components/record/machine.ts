/**
 * The signed-in recorder (/record) as one state machine, pure so the tests
 * can walk it. The ideas are the answer page's (pages/answer/machine.ts);
 * the ending is the phone's RecordAnswerScreen: the voice goes up first, so
 * it is safe, then the words come back for a light edit, then it is kept.
 *
 *   ready → consent (first time in this browser) → starting → recording → review
 *   ready → starting (consent already answered)
 *   starting → noMic (microphone refused or missing) → starting (try again)
 *   review → confirmRedo → starting (only after they say yes)
 *   review → uploading → words → saving → kept
 *   uploading → uploadFailed (the take is kept) → uploading
 *   saving → saveFailed (the words and the uploaded voice are kept) → saving
 */
import type { Take } from "../../pages/answer/machine";
import type { Clip } from "../../data/stories";

export type { Take };

export type Phase =
  | "ready"
  | "consent"
  | "starting"
  | "recording"
  | "review"
  | "confirmRedo"
  | "noMic"
  | "uploading"
  | "uploadFailed"
  | "words"
  | "saving"
  | "saveFailed"
  | "kept";

/** Why the words box says what it says: the words came back, AI is off, or they didn't come through. */
export type WordsFrom = "transcript" | "off" | "missing";

export type State = {
  phase: Phase;
  /** Made once per page, so the upload's path and the memory's id agree on every retry. */
  memoryId: string;
  take: Take | null;
  /** Their answer to "Talking with A Story": null until asked in this browser. */
  ai: boolean | null;
  /** The voice once it is in storage. */
  clip: Clip | null;
  words: string;
  wordsFrom: WordsFrom | null;
  /** The microphone was refused, rather than missing from this browser. */
  micRefused: boolean;
};

export type Event =
  | { type: "RECORD" }
  | { type: "CONSENT"; allow: boolean }
  | { type: "MIC_OK" }
  | { type: "MIC_REFUSED" }
  | { type: "NO_MIC" }
  | { type: "TRY_MIC" }
  | { type: "STOPPED"; take: Take }
  | { type: "REDO" }
  | { type: "REDO_YES" }
  | { type: "REDO_NO" }
  | { type: "KEEP" }
  | { type: "UPLOADED"; clip: Clip; words: string | null }
  | { type: "UPLOAD_FAILED" }
  | { type: "TEXT"; text: string }
  | { type: "SAVE" }
  | { type: "SAVED" }
  | { type: "SAVE_FAILED" };

export function initialState(memoryId: string, ai: boolean | null = null): State {
  return { phase: "ready", memoryId, take: null, ai, clip: null, words: "", wordsFrom: null, micRefused: false };
}

export function reduce(s: State, e: Event): State {
  switch (e.type) {
    case "RECORD":
      if (s.phase !== "ready") return s;
      // asked once, before they speak; either answer still records
      return { ...s, phase: s.ai === null ? "consent" : "starting" };
    case "CONSENT":
      return s.phase === "consent" ? { ...s, phase: "starting", ai: e.allow } : s;
    case "MIC_OK":
      return s.phase === "starting" ? { ...s, phase: "recording" } : s;
    case "MIC_REFUSED":
      if (s.phase !== "starting" && s.phase !== "recording") return s;
      return { ...s, phase: "noMic", micRefused: true, take: null };
    case "NO_MIC":
      // this browser cannot record at all: writing is the way in, said plainly
      return s.phase === "ready" ? { ...s, phase: "noMic", micRefused: false } : s;
    case "TRY_MIC":
      return s.phase === "noMic" ? { ...s, phase: s.ai === null ? "consent" : "starting" } : s;
    case "STOPPED":
      if (s.phase !== "recording") return s;
      // nothing came through (a tap and an immediate stop): back to the one button
      if (!e.take.blob.size) return { ...s, phase: "ready", take: null };
      return { ...s, phase: "review", take: e.take };
    case "REDO":
      return s.phase === "review" ? { ...s, phase: "confirmRedo" } : s;
    case "REDO_NO":
      return s.phase === "confirmRedo" ? { ...s, phase: "review" } : s;
    case "REDO_YES":
      return s.phase === "confirmRedo" ? { ...s, phase: "starting", take: null } : s;
    case "KEEP":
      if ((s.phase === "review" || s.phase === "uploadFailed") && s.take) return { ...s, phase: "uploading" };
      return s;
    case "UPLOADED": {
      if (s.phase !== "uploading") return s;
      const words = (e.words || "").trim();
      const wordsFrom: WordsFrom = !s.ai ? "off" : words ? "transcript" : "missing";
      return { ...s, phase: "words", clip: e.clip, words, wordsFrom };
    }
    case "UPLOAD_FAILED":
      return s.phase === "uploading" ? { ...s, phase: "uploadFailed" } : s;
    case "TEXT":
      return s.phase === "words" || s.phase === "saveFailed" ? { ...s, words: e.text } : s;
    case "SAVE":
      return (s.phase === "words" || s.phase === "saveFailed") && s.clip ? { ...s, phase: "saving" } : s;
    case "SAVED":
      return s.phase === "saving" ? { ...s, phase: "kept" } : s;
    case "SAVE_FAILED":
      return s.phase === "saving" ? { ...s, phase: "saveFailed" } : s;
  }
}

/** Leaving now would lose something that exists nowhere else. */
export const holdsUnsaved = (p: Phase) => !["ready", "consent", "starting", "noMic", "kept"].includes(p);
