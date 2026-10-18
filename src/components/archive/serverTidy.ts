/**
 * The tidied reading of a spoken memory, from the AI server's "tidy" pass
 * (`POST /api/memory/help`, mode "tidy", the same one the writer uses; it
 * saves nothing on the server: phone-app/docs/memory-help-for-server.md).
 *
 * What is sent is the local clean transcript (lib transcript.ts: fillers,
 * false starts and the other person's lines already out), so the server's
 * job is only full stops, capitals and paragraph breaks. The result is
 * checked before it is shown: it must keep the teller's words (none added,
 * none dropped beyond a few), or it is thrown away. The local cleaner is the
 * instant first render and the offline fallback.
 *
 * The result is kept in this browser (localStorage, keyed by the memory and
 * a hash of its words, so an edit asks again), never in the database. It
 * replaces the local text only before the reader has reached the words;
 * otherwise it waits for the next visit, so nothing reflows under the eye.
 * The requests go one at a time.
 *
 * Off until the AI server allows the web app's origin: on 17 Oct 2026 its
 * /api/memory/help answered the browser's preflight without an
 * Access-Control-Allow-Origin header, so every call failed. Turn it on with
 * VITE_TIDY_FROM_SERVER=1 once the server allows app.astoryapp.com.
 */
import { useEffect, useMemo, useState } from "react";
import { tidy, isAiConfigured } from "../../data/ai";
import { tidyText } from "../../app-core/lib/writeHelper.js";
import { ASKED } from "./transcript";

const KEY = "astory.tidy.v1.";
const ON = import.meta.env.VITE_TIDY_FROM_SERVER === "1";

function hash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

const tokens = (s: string) => (s.toLowerCase().match(/[\p{L}\p{N}'’]+/gu) || []).map((w) => w.replace(/’/g, "'"));

/** The server kept their words: almost nothing new, almost nothing gone, in about the same number. */
export function keepsTheirWords(input: string, output: string): boolean {
  const a = tokens(input);
  const b = tokens(output);
  if (!a.length || !b.length) return false;
  const ratio = b.length / a.length;
  if (ratio < 0.9 || ratio > 1.04) return false;
  const have = new Set(a);
  const added = b.filter((w) => !have.has(w)).length;
  return added / b.length <= 0.02;
}

type Cached = { h: string; p: string[] };

function readCache(id: string, h: string): string[] | null {
  try {
    const raw = localStorage.getItem(KEY + id);
    if (!raw) return null;
    const c = JSON.parse(raw) as Cached;
    return c && c.h === h && Array.isArray(c.p) ? c.p : null;
  } catch {
    return null;
  }
}

function writeCache(id: string, h: string, p: string[]) {
  try {
    localStorage.setItem(KEY + id, JSON.stringify({ h, p } satisfies Cached));
  } catch {
    /* a full or blocked store: the page simply asks again next time */
  }
}

/**
 * The server-tidied paragraphs for a spoken memory, or null while it is
 * asked for, when it is off, failed, or did not keep the teller's words.
 * `local` is the clean transcript (with the other person's questions as
 * ASKED lines, which are never sent and stay where they were).
 */
export function useServerTidy(memoryId: string | null, raw: string, local: string[], enabled: boolean, about = ""): string[] | null {
  const h = hash(raw);
  const cached = useMemo(() => (ON && memoryId && enabled ? readCache(memoryId, h) : null), [memoryId, enabled, h]);
  const [result, setResult] = useState<{ for: string; p: string[] } | null>(null);
  const localKey = local.join("\n\n");

  useEffect(() => {
    if (!ON || !memoryId || !enabled || !isAiConfigured || cached) return;
    let live = true;
    // the teller's runs between the other person's questions, each tidied on its own; the questions stay put
    const blocks: { asked?: string; text?: string }[] = [];
    let run: string[] = [];
    for (const p of localKey.split("\n\n")) {
      if (p.startsWith(ASKED)) {
        if (run.length) blocks.push({ text: run.join("\n\n") });
        blocks.push({ asked: p });
        run = [];
      } else if (p.trim()) run.push(p);
    }
    if (run.length) blocks.push({ text: run.join("\n\n") });

    // one block at a time, in order: a long call with many "We asked" breaks never fires a burst of requests
    const tidyBlock = async (b: { asked?: string; text?: string }): Promise<string[]> => {
      if (b.asked) return [b.asked];
      const input = b.text || "";
      const out = await tidy(input, about);
      // the writer's tidy falls back to the phone's own pass when the server is away: that is not the server's answer
      if (!out || out === tidyText(input) || !keepsTheirWords(input, out)) throw new Error("not tidied");
      return out
        .replace(/\r\n?/g, "\n")
        .split(/\n\s*\n/)
        .map((x) => x.replace(/\s*\n\s*/g, " ").trim())
        .filter(Boolean);
    };
    const asked = performance.now();
    (async () => {
      const parts: string[] = [];
      for (const b of blocks) parts.push(...(await tidyBlock(b)));
      return parts;
    })()
      .then((p) => {
        if (!live) return;
        writeCache(memoryId, h, p);
        // shown now only before anyone can be reading; otherwise next visit, from the cache (nothing reflows under the eye)
        const words = document.querySelector(".mv-words");
        if (mayApplyTidy(words ? words.getBoundingClientRect().top : Infinity, window.innerHeight, performance.now() - asked)) setResult({ for: `${memoryId}:${h}`, p });
      })
      .catch(() => {
        /* the local clean transcript stays */
      });
    return () => {
      live = false;
    };
  }, [memoryId, enabled, h, localKey, about, cached]);

  if (cached) return cached;
  return result && result.for === `${memoryId}:${h}` ? result.p : null;
}

/**
 * Whether a tidied text that has just arrived may replace the words on screen: only when it lands within the first
 * 600ms (before anyone has read a line), or while the words are still below the fold. Words in view count as being
 * read, scrolled or not.
 */
export function mayApplyTidy(wordsTop: number, viewportHeight: number, elapsedMs: number): boolean {
  return elapsedMs <= 600 || wordsTop >= viewportHeight * 0.85;
}
