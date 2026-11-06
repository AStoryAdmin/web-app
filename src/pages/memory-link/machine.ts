/**
 * The memory link page as one state machine, pure so the tests can walk it.
 *
 *   loading → shown | opened | notFound | notReady | loadError
 *   loadError → loading ("Try again")
 *
 * There is nothing else to do on this page: it opens once, and plays.
 */
import type { LinkedMemory, LoadResult } from "../../lib/memoryLink";

export type Phase = "loading" | "loadError" | "shown" | "opened" | "notFound" | "notReady";

export type State = {
  phase: Phase;
  memory: LinkedMemory | null;
  /** The sender's first name, when the server has it (for "Ask Daniel to send a new one"). */
  senderName: string;
  /** Why the load failed: no connection, or our side (rate limit, server). */
  loadReason: "network" | "server";
};

export type Event = { type: "LOADED"; result: LoadResult } | { type: "RETRY_LOAD" };

export const initialState: State = { phase: "loading", memory: null, senderName: "", loadReason: "network" };

export function reduce(s: State, e: Event): State {
  switch (e.type) {
    case "LOADED": {
      if (s.phase !== "loading") return s;
      const r = e.result;
      if (r.kind === "shown") return { ...s, phase: "shown", memory: r.memory, senderName: r.memory.senderName };
      if (r.kind === "opened") return { ...s, phase: "opened", memory: null, senderName: r.senderName };
      if (r.kind === "notFound" || r.kind === "notReady") return { ...s, phase: r.kind, memory: null };
      return { ...s, phase: "loadError", loadReason: r.reason };
    }
    case "RETRY_LOAD":
      return s.phase === "loadError" ? { ...s, phase: "loading" } : s;
  }
}

/** The phases where the page shows one message and nothing to play. */
export const isEnd = (p: Phase) => p === "opened" || p === "notFound" || p === "notReady";

/** Minutes and seconds, for the button's small line: "1 min 34 s". */
export function lengthWords(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (!m) return `${s} s`;
  return s ? `${m} min ${s} s` : `${m} min`;
}

const firstOf = (s: string) => s.trim().split(/\s+/)[0] || "";

/** The one line for a link that no longer opens: who to ask for a new one, by first name when known. No em-dash. */
export function closedLine(senderName: string): string {
  const who = firstOf(senderName);
  return who && who.toLowerCase() !== "the" ? `Ask ${who} to send a new one.` : "Ask the person who sent it to send a new one.";
}
