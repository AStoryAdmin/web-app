/**
 * Where the codes in a book point. The listening codes go where the phone
 * app's printed book sends them (phone-app/src/lib/links.js LISTEN_URL):
 * the marketing domain's /l page, which passes the query on to the listen
 * Edge Function. A printed book lasts decades and a project URL may not.
 * The code itself is built by app-core's listenUrl, so a code made here is
 * the code the phone app would print.
 */
import { hasVoice, listenUrl, normaliseDesign } from "../app-core/lib/bookDesign.js";
import type { Memory, Story } from "../data/stories";

const SITE = "https://astoryapp.com";

/** The base of every listening code: VITE_LISTEN_URL, or the site's /l. */
export function listenBase(): string {
  const env = (import.meta.env.VITE_LISTEN_URL as string | undefined) || "";
  return (env || `${SITE}/l`).replace(/\/$/, "");
}

/** The listening code's link for a memory with a recording, or null (no voice, no key, codes turned off). */
export function listenLink(story: Pick<Story, "bookDesign">, memory: Memory): string | null {
  const d = normaliseDesign(story.bookDesign) as { qr: boolean; listenKey: string };
  if (!d.qr || !d.listenKey || !hasVoice(memory)) return null;
  return listenUrl(listenBase(), memory.id, d.listenKey) as string | null;
}

/** Whether a story needs a listening key before its codes can be drawn. */
export function needsListenKey(story: Pick<Story, "bookDesign" | "memories">): boolean {
  const d = normaliseDesign(story.bookDesign) as { qr: boolean; listenKey: string };
  return d.qr && !d.listenKey && story.memories.some((m) => hasVoice(m));
}

/** The family's archive on the web: where the last page's code points. */
export function archiveLink(): string {
  const site = (import.meta.env.VITE_SITE_URL as string | undefined) || (typeof window !== "undefined" ? window.location.origin : SITE);
  return `${site.replace(/\/$/, "")}/archive`;
}

/** The samples page for one of the three fictional families. */
export const sampleLink = (key: string): string => `${SITE}/samples#${key}`;
