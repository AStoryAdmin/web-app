/**
 * The printed book's reading page as one state machine, pure so the tests can walk it.
 *
 *   loading → shown | notFound | notReady | loadError
 *   loadError → loading ("Try again")
 *
 * A code that cannot be read at all (parseReadQuery says invalid) starts in notFound and never loads.
 */
import type { LoadResult, ReadMemory, ReadQuery } from "../../lib/bookRead";

export type Phase = "loading" | "loadError" | "shown" | "notFound" | "notReady";

export type State = {
  phase: Phase;
  memories: ReadMemory[];
  /** Why the load failed: no connection, or our side (rate limit, server). */
  loadReason: "network" | "server";
};

export type Event = { type: "LOADED"; result: LoadResult } | { type: "RETRY_LOAD" };

export const initialState: State = { phase: "loading", memories: [], loadReason: "network" };

/** Where the page starts for a code: loading, or straight to "not a book we know" for one it cannot read. */
export function startState(q: ReadQuery): State {
  return q.kind === "invalid" ? { ...initialState, phase: "notFound" } : initialState;
}

export function reduce(s: State, e: Event): State {
  switch (e.type) {
    case "LOADED": {
      if (s.phase !== "loading") return s;
      const r = e.result;
      if (r.kind === "shown") return { ...s, phase: "shown", memories: r.memories };
      if (r.kind === "notFound" || r.kind === "notReady") return { ...s, phase: r.kind, memories: [] };
      return { ...s, phase: "loadError", loadReason: r.reason };
    }
    case "RETRY_LOAD":
      return s.phase === "loadError" ? { ...s, phase: "loading" } : s;
  }
}

/** The phases where the page shows one message and nothing to read. */
export const isEnd = (p: Phase) => p === "notFound" || p === "notReady";

/** The line over a chapter: the book's chapter, or whose memory this is. */
export function headline(q: ReadQuery, memories: ReadMemory[]): string {
  const teller = (memories[0]?.tellerName || "").trim();
  if (q.kind === "chapter") return teller ? `${q.chapter.name}, from ${teller}’s book` : q.chapter.name;
  return teller ? `From ${teller}’s book` : "From the book";
}

/** The title the browser shows. */
export function pageTitle(q: ReadQuery, memories: ReadMemory[]): string {
  if (q.kind === "chapter") return `${q.chapter.name} · A Story`;
  const t = memories[0]?.title;
  return t ? `${t} · A Story` : "A Story";
}
